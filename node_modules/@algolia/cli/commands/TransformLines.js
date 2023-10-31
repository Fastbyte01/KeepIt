const fs = require('fs');
const readLine = require('readline');
const Base = require('./Base.js');

class TransformLinesScript extends Base {
  constructor() {
    super();
    // Bind class methods
    this.defaultLineTransformation = this.defaultLineTransformation.bind(this);
    this.setOutput = this.setOutput.bind(this);
    this.setTransformations = this.setTransformations.bind(this);
    this.transformFile = this.transformFile.bind(this);
    this.init = this.init.bind(this);
    this.start = this.start.bind(this);
    // Define validation constants
    this.message =
      '\nExample: $ algolia transformlines -s sourcefilepath -o outputpath -t transformationfilepath \n\n';
    this.params = ['sourcefilepath'];
  }

  defaultLineTransformation(line) {
    // Default line transformation method
    /* eslint-disable no-control-regex */
    const newLine = line.match(/\u001e/, 'i')
      ? line.replace(/\u001e/, ',')
      : line;
    return newLine;
    /* eslint-enable no-control-regex */
  }

  setOutput(outputPath) {
    this.outputDir =
      outputPath !== null ? this.normalizePath(outputPath) : process.cwd();

    // Ensure outputpath is a directory
    if (!fs.lstatSync(this.outputDir).isDirectory())
      throw new Error('Output path must be a directory.');
  }

  setTransformations(transformationFilepath) {
    try {
      // Set JSON record transformations
      const transformations = transformationFilepath
        ? require(this.normalizePath(transformationFilepath))
        : null;
      // Validate transformations function input param
      const valid = transformations && typeof transformations === 'function';
      // Assign our transformations function using provided custom transformations file if exists
      this.lineTransformation = valid
        ? transformations
        : this.defaultLineTransformation;
    } catch (e) {
      throw e;
    }
  }

  // Method to transform an individual file line-by-line
  transformFile(filename) {
    return new Promise((resolve, reject) => {
      try {
        const writeStream = fs.createWriteStream(
          `${this.outputDir}/${filename}`
        );
        let count = 0;

        if (this.transformationFilepath === null) {
          writeStream.write('['); // Comment this out to prevent injecting opening bracket at start of new output file
        }

        const lineReader = readLine.createInterface({
          input: fs.createReadStream(`${this.directory}/${filename}`),
        });

        lineReader.on('line', line => {
          count++;
          const newLine = this.lineTransformation(line);
          this.writeProgress(`Line ${count}...`);
          writeStream.write(newLine);
        });

        lineReader.on('close', () => {
          console.log('Done writing!');
          if (this.transformationFilepath === null) {
            writeStream.write(']'); // Comment this out to prevent injecting closing bracket at end of new output file
          }
          writeStream.end();
          resolve(true);
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  // Start script
  async init(filenames) {
    for (const filename of filenames) {
      try {
        console.log(`Reading: ${this.directory}/${filename}`);
        console.log(`Writing to: ${this.outputDir}/${filename}`);
        await this.transformFile(filename);
      } catch (e) {
        console.log(`Error while processing ${filename}`);
        throw new Error(e);
      }
    }
  }

  start(program) {
    // Script reads a file or directory of files synchronously, line-by-line.
    // Writes each file synchronously, line-by-line, to an output directory
    // while optionally applying a provided transformation function to each line.

    // Validate command; if invalid display help text and exit
    this.validate(program, this.message, this.params);

    // Config params
    this.sourceFilepath = program.sourcefilepath;
    this.outputpath = program.outputpath || null;
    this.transformationFilepath = program.transformationfilepath || null;

    // Configure source paths (this.directory, this.filenames)
    this.setSource({ sourceFilepath: this.sourceFilepath });
    // Configure output path (this.outputDir)
    this.setOutput(this.outputpath);
    // Configure transformations (this.lineTransformation)
    this.setTransformations(this.transformationFilepath);

    // Execute line transformations
    this.init(this.filenames);
    return false;
  }
}

const transformLinesScript = new TransformLinesScript();
module.exports = transformLinesScript;
