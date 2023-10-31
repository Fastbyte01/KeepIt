const fs = require('fs');
const path = require('path');
const algolia = require('algoliasearch');
const Base = require('./Base.js');

class ExportScript extends Base {
  constructor() {
    super();
    // Bind class methods
    this.getOutput = this.getOutput.bind(this);
    this.parseParams = this.parseParams.bind(this);
    this.writeFile = this.writeFile.bind(this);
    this.exportData = this.exportData.bind(this);
    this.start = this.start.bind(this);
    // Define validation constants
    this.message =
      '\nExample: $ algolia export -a algoliaappid -k algoliaapikey -n algoliaindexname -o outputpath -p params\n\n';
    this.params = ['algoliaappid', 'algoliaapikey', 'algoliaindexname'];
  }

  getOutput(outputPath) {
    // If no outputPath is provided, use directory from which command was invoked
    const outputDir =
      outputPath !== null ? this.normalizePath(outputPath) : process.cwd();
    // Ensure outputPath is a directory
    if (!fs.lstatSync(outputDir).isDirectory())
      throw new Error('Output path must be a directory.');
    return outputDir;
  }

  parseParams(params) {
    try {
      if (params === null) return { hitsPerPage: 1000 };
      return JSON.parse(params);
    } catch (e) {
      throw e;
    }
  }

  writeFile(hits, options, fileCount) {
    const filename = `algolia-index-${options.indexName}-${fileCount}.json`;
    const filePath = path.resolve(options.outputPath, filename);
    fs.writeFileSync(filePath, JSON.stringify(hits));
    return console.log(`\nDone writing ${filename}`);
  }

  exportData(options) {
    return new Promise((resolve, reject) => {
      // Instantiate Algolia index
      const client = algolia(options.appId, options.apiKey);
      const index = client.initIndex(options.indexName);

      // Export index
      const browse = index.browseAll('', options.params);
      let hits = [];
      let hitsCount = 0;
      let fileCount = 0;

      browse.on('result', result => {
        // Push 1000 new hits to array
        hits = hits.concat(result.hits);
        hitsCount += result.hits.length;
        this.writeProgress(`Records browsed: ${hitsCount}`);
        if (hits.length >= 10000) {
          // Write batch of 10,000 records to file
          fileCount++;
          this.writeFile(hits, options, fileCount);
          // Clear array
          hits = [];
        }
      });

      browse.on('end', () => {
        if (hits.length > 0) {
          // Write remaining records to file
          fileCount++;
          this.writeFile(hits, options, fileCount);
        }
        return resolve(
          `\nDone exporting index.\nSee your data here: ${options.outputPath}`
        );
      });

      browse.on('error', err => reject(err));
    });
  }

  async start(program) {
    try {
      // Validate command; if invalid display help text and exit
      this.validate(program, this.message, this.params);

      // Config params
      const options = {
        appId: program.algoliaappid,
        apiKey: program.algoliaapikey,
        indexName: program.algoliaindexname,
        outputPath: program.outputpath || null,
        params: program.params || null,
      };

      // Configure and validate output path
      options.outputPath = this.getOutput(options.outputPath);
      // Configure browseAll params
      options.params = this.parseParams(options.params);

      // Export data
      const result = await this.exportData(options);
      return console.log(result);
    } catch (e) {
      throw e;
    }
  }
}

const exportScript = new ExportScript();
module.exports = exportScript;
