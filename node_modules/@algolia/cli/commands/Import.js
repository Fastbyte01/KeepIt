const fs = require('fs');
const JSONStream = require('JSONStream');
const through = require('through');
const transform = require('stream-transform');
const Batch = require('batch-stream');
const async = require('async');
const csv = require('csvtojson');
const regexParser = require('regex-parser');
const chalk = require('chalk');
const algolia = require('algoliasearch');
const Base = require('./Base.js');

class ImportScript extends Base {
  constructor() {
    super();
    // Bind class methods
    this.defaultTransformations = this.defaultTransformations.bind(this);
    this.suggestions = this.suggestions.bind(this);
    this.checkMemoryUsage = this.checkMemoryUsage.bind(this);
    this.handleHighMemoryUsage = this.handleHighMemoryUsage.bind(this);
    this.handleExtremeMemoryUsage = this.handleExtremeMemoryUsage.bind(this);
    this.setIndex = this.setIndex.bind(this);
    this.setTransformations = this.setTransformations.bind(this);
    this.setCsvOptions = this.setCsvOptions.bind(this);
    this.conditionallyParseCsv = this.conditionallyParseCsv.bind(this);
    this.setBatchSize = this.setBatchSize.bind(this);
    this.estimateBatchSize = this.estimateBatchSize.bind(this);
    this.updateBatchSize = this.updateBatchSize.bind(this);
    this.importToAlgolia = this.importToAlgolia.bind(this);
    this.retryImport = this.retryImport.bind(this);
    this.indexFiles = this.indexFiles.bind(this);
    this.start = this.start.bind(this);
    // Define validation constants
    this.message =
      '\nExample: $ algolia import -s sourcefilepath -a algoliaappid -k algoliaapikey -n algoliaindexname -b batchsize -t transformationfilepath -m maxconcurrency -p csvtojsonparams\n\n';
    this.params = [
      'sourcefilepath',
      'algoliaappid',
      'algoliaapikey',
      'algoliaindexname',
    ];
  }

  defaultTransformations(data, cb) {
    cb(null, data);
  }

  suggestions() {
    let output = `\nConsider reducing <batchSize> (currently ${
      this.batchSize
    }).`;
    if (this.maxConcurrency > 1)
      output += `\nConsider reducing <maxConcurrency> (currently ${
        this.maxConcurrency
      }).`;
    return output;
  }

  checkMemoryUsage() {
    // Exit early if high memory usage warning issued too recently
    if (this.highMemoryUsage) return false;
    // Get memory usage
    const { usedMb, percentUsed } = this.getMemoryUsage();
    // Handle if heap usage exceeds n% of estimated allocation for node process
    if (percentUsed >= 70) this.handleHighMemoryUsage(percentUsed);
    if (percentUsed >= 90) this.handleExtremeMemoryUsage(usedMb, percentUsed);
    return false;
  }

  handleHighMemoryUsage(percentUsed) {
    const newBatchSize = Math.floor(this.batchSize / 2);
    this.updateBatchSize(newBatchSize);
    this.writeProgress(
      `High memory usage (${percentUsed}%). Reducing batchSize to ${newBatchSize}`
    );
  }

  handleExtremeMemoryUsage(usedMb, percentUsed) {
    // Issue warning
    const name = `Warning: High memory usage`;
    const message = `Memory usage at ${usedMb} MB (${percentUsed}% of heap allocation for this process).`;
    // Set class instance flag to debounce future warnings
    this.highMemoryUsage = true;
    // Output warning
    console.log(
      chalk.white.bgRed(`\n${name}`),
      chalk.red(`\n${message}`),
      chalk.red(`${this.suggestions()}`)
    );
    // Reset flag in 30 seconds
    setTimeout(() => {
      this.highMemoryUsage = false;
    }, 30000);
  }

  setIndex(options) {
    // Set Algolia index
    this.client = algolia(options.appId, options.apiKey);
    this.index = this.client.initIndex(options.indexName);
  }

  setTransformations(options) {
    try {
      // Set JSON record transformations
      const transformations = options.transformations
        ? require(this.normalizePath(options.transformations))
        : null;
      // Validate transformations function input param
      const valid = transformations && typeof transformations === 'function';
      // Assign our transformations function using provided custom transformations file if exists
      this.formatRecord = valid ? transformations : this.defaultTransformations;
    } catch (e) {
      throw e;
    }
  }

  setCsvOptions(options) {
    try {
      this.csvOptions = options.csvToJsonParams
        ? JSON.parse(options.csvToJsonParams)
        : null;
      if (!this.csvOptions) return;
      const csvToJsonRegexPropertyList = ['includeColumns', 'ignoreColumns'];
      csvToJsonRegexPropertyList.forEach(prop => {
        if (this.csvOptions.hasOwnProperty(prop)) {
          this.csvOptions[prop] = regexParser(this.csvOptions[prop]);
        }
      });
    } catch (e) {
      throw e;
    }
  }

  conditionallyParseCsv(isCsv) {
    // Return the appropriate writestream for piping depending on filetype
    return isCsv
      ? csv(this.csvOptions) // Convert from CSV to JSON
      : through(); // Do nothing
  }

  async setBatchSize(options) {
    try {
      // If user provided batchSize, use and exit early
      // Otherwise calculate and set optimal batch size
      if (options.objectsPerBatch !== null) {
        this.batchSize = options.objectsPerBatch;
        return;
      }
      // Test files to estimate optimal batch size
      const estimatedBatchSize = await this.estimateBatchSize();
      // Test network upload speed
      const uploadSpeedMb = await this.getNetworkSpeed();
      // Calculate optimal batch size
      this.writeProgress('Calculating optimal batch size...');
      let batchSize;
      // Reconcile batch size with network speed
      if (uploadSpeedMb >= this.desiredBatchSizeMb)
        batchSize = Math.floor(estimatedBatchSize);
      else
        batchSize = Math.floor(
          (uploadSpeedMb / this.desiredBatchSizeMb) * estimatedBatchSize
        );
      // Ensure minimum batch size is enforced
      batchSize = Math.max(this.minBatchSize, batchSize);
      console.log(chalk.blue(`\nOptimal batch size: ${batchSize}`));
      // Set batch size
      this.batchSize = batchSize;
    } catch (e) {
      throw e;
    }
  }

  estimateBatchSize() {
    // Read file, estimate average record size, estimate batch size
    // Return estimated batch size divided by maxConcurrency
    return new Promise((resolve, reject) => {
      try {
        const filename = this.filenames[0];
        const file = `${this.directory}/${filename}`;
        const isCsv = filename.split('.').pop() === 'csv';
        const fileStream = fs.createReadStream(file, {
          autoclose: true,
          flags: 'r',
        });
        this.writeProgress(`Estimating data size...`);
        const jsonStreamOption = isCsv ? null : '*';
        fileStream
          .pipe(this.conditionallyParseCsv(isCsv))
          .pipe(JSONStream.parse(jsonStreamOption))
          .pipe(transform(this.formatRecord))
          .pipe(new Batch({ size: 10000 }))
          .pipe(
            through(data => {
              const count = data.length;
              const string = JSON.stringify(data);
              const batchSizeMb = this.getStringSizeMb(string);
              const avgRecordSizeMb = batchSizeMb / count;
              const avgRecordSizeKb = Math.ceil(avgRecordSizeMb * 1000);
              const roughBatchSize = this.desiredBatchSizeMb / avgRecordSizeMb;
              const estimatedBatchSize = Math.floor(
                roughBatchSize / this.maxConcurrency
              );
              console.log(
                chalk.blue(`\nAverage record size: ${avgRecordSizeKb} Kb`)
              );
              fileStream.destroy();
              resolve(estimatedBatchSize);
            })
          );
      } catch (e) {
        reject(e);
      }
    });
  }

  updateBatchSize(newSize) {
    this.batchSize = newSize;
  }

  getBatchStream() {
    return new Batch({ size: this.batchSize });
  }

  async importToAlgolia(data) {
    // Method to index batches of records in Algolia
    try {
      await this.index.addObjects(data);
      this.importCount += data.length;
      this.writeProgress(`Records indexed: ${this.importCount}`);
    } catch (e) {
      let message = e.message;
      let addendum = e.stack;
      if (e.name === 'AlgoliaSearchRequestTimeoutError') {
        message = `You may be attempting to import batches too large for the network connection.`;
        addendum = this.suggestions();
        this.retryImport(data);
      }
      console.log(
        chalk.white.bgRed(`\nImport error: ${e.name}`),
        chalk.red(`\n${message}`),
        chalk.red(addendum)
      );
      throw e;
    }
  }

  retryImport(data) {
    // Algolia import retry strategy
    try {
      this.retryCount++;
      console.log(`\n(${this.retryCount}) Retrying batch...`);
      const importedBatchCount = Math.floor(this.importCount / this.batchSize);
      const retryLimit =
        this.retryCount > 15 && this.retryCount > importedBatchCount / 2;
      if (retryLimit) {
        console.log(
          chalk.white.bgRed(`\nError: Failure to index data`),
          chalk.red(`\nRetry limit reached.`),
          chalk.red(this.suggestions())
        );
        return;
      }
      // Split data in half
      const middle = Math.floor(data.length / 2);
      const firstHalf = data.splice(0, middle);
      // Reduce batchsize
      if (this.batchSize > middle) this.updateBatchSize(middle);
      // Push each half of data into import queue
      this.queue.push([firstHalf]);
      this.queue.push([data]);
    } catch (e) {
      console.error('Retry error:', e);
      throw e;
    }
  }

  indexFiles(filenames) {
    // Recursive method that iterates through an array of filenames, opens a read stream for each file
    // then pipes the read stream through a series of transformations (parse CSV/JSON objects, transform
    // them, batch them, index them in Algolia) while imposing a queue so that only so many
    // indexing threads will be run in parallel
    if (filenames.length <= 0) {
      console.log('\nDone reading files');
      return;
    }
    // Start new file read stream
    // Note: filenames is a reference to the mutable class instance variable this.filenames
    const filename = filenames.pop();
    const file = `${this.directory}/${filename}`;
    const isCsv = filename.split('.').pop() === 'csv';
    const fileStream = fs.createReadStream(file, {
      autoclose: true,
      flags: 'r',
    });

    fileStream.on('data', () => {
      if (this.queue.length() >= this.maxConcurrency) {
        // If async upload queue is full, pause reading from file stream
        fileStream.pause();
      }
    });

    fileStream.on('end', () => {
      // File complete, process next file
      this.indexFiles(filenames);
    });

    // Once the async upload queue is drained, resume reading from file stream
    this.queue.drain = () => {
      fileStream.resume();
    };

    // Handle parsing, transforming, batching, and indexing JSON and CSV files
    console.log(`\nImporting [${filename}]`);
    const jsonStreamOption = isCsv ? null : '*';
    fileStream
      .pipe(this.conditionallyParseCsv(isCsv, filename))
      .pipe(JSONStream.parse(jsonStreamOption))
      .pipe(transform(this.formatRecord))
      .pipe(this.getBatchStream())
      .pipe(
        through(data => {
          this.checkMemoryUsage();
          this.queue.push([data]);
        })
      );
  }

  async start(program) {
    // Script reads JSON or CSV file, or directory of such files, optionally applies
    // transformations, then batches and indexes the data in Algolia.

    // Validate command; if invalid display help text and exit
    this.validate(program, this.message, this.params);

    // Config params
    const options = {
      sourceFilepath: program.sourcefilepath,
      appId: program.algoliaappid,
      apiKey: program.algoliaapikey,
      indexName: program.algoliaindexname,
      objectsPerBatch: program.batchsize || null,
      transformations: program.transformationfilepath || null,
      maxConcurrency: program.maxconcurrency || 2,
      csvToJsonParams: program.params || null,
    };
    // Configure Algolia (this.client, this.index)
    this.setIndex(options);
    // Configure source paths (this.directory, this.filenames)
    this.setSource(options);
    // Configure transformations (this.formatRecord)
    this.setTransformations(options);
    // Configure optional csvtojson params (this.csvOptions)
    this.setCsvOptions(options);
    // Configure data upload parameters
    this.maxConcurrency = options.maxConcurrency;
    // Theoretically desirable batch size in MB
    this.desiredBatchSizeMb = 10;
    // Minimum batch size
    this.minBatchSize = 100;
    // Configure number of records to index per batch (this.batchSize, this.batch)
    await this.setBatchSize(options);
    // Assign dangerous memory usage flag
    this.highMemoryUsage = false;
    // Assign import count
    this.importCount = 0;
    // Assign retry count
    this.retryCount = 0;
    // Assign async queue
    this.queue = async.queue(this.importToAlgolia, this.maxConcurrency);

    // Execute import
    console.log(chalk.bgGreen.white('Starting import...'));
    return this.indexFiles(this.filenames);
  }
}

const importScript = new ImportScript();
module.exports = importScript;
