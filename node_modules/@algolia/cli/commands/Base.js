const os = require('os');
const fs = require('fs');
const path = require('path');
const readLine = require('readline');
const chalk = require('chalk');
const speedTest = require('speedtest-net');

class Base {
  constructor() {
    this.maxHeapMb = process.arch.includes('64') ? 1024 : 512;
  }

  validate(program, message, params) {
    let flag = false;
    let output = message;
    params.forEach(param => {
      if (!program[param]) {
        output += chalk.red(`Must specify ${param}\n`);
        flag = true;
      }
    });
    if (flag) return program.help(h => h + output);
    else return { flag, output };
  }

  writeProgress(message) {
    readLine.clearLine(process.stdout, 0);
    readLine.cursorTo(process.stdout, 0);
    process.stdout.write(message);
  }

  normalizePath(input) {
    // Convert path input param to valid system absolute path
    // Path is absolute, originating from system root
    if (path.isAbsolute(input)) return input;
    // Path is relative to user's home directory
    if (input[0] === '~') return path.join(os.homedir(), input.substr(1));
    // Path is relative to current directory
    return path.resolve(process.cwd(), input);
  }

  setSource(options) {
    // Set source directory and filenames array
    // Used to process path inputs that may either be a single file or a directory of files
    const source = this.normalizePath(options.sourceFilepath);
    if (fs.lstatSync(source).isDirectory()) {
      this.directory = source;
      this.filenames = fs.readdirSync(source);
    } else if (fs.lstatSync(source).isFile()) {
      this.directory = path.parse(source).dir;
      this.filenames = [path.parse(source).base];
    } else {
      throw new Error('Invalid sourcefilepath param');
    }
  }

  getMemoryUsage() {
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    const usedMb = Math.round(used * 100) / 100;
    const percentUsed = Math.floor((usedMb / this.maxHeapMb) * 100);
    return { usedMb, percentUsed };
  }

  getStringSizeMb(string) {
    const bytes = Buffer.byteLength(string, 'utf8');
    const mb = bytes / 1024 / 1024;
    return Math.ceil(mb);
  }

  getNetworkSpeed() {
    return new Promise((resolve, reject) => {
      this.writeProgress('Estimating network speed...');
      const test = speedTest({ maxTime: 5000 });
      let downloadSpeedMb = null;
      let uploadSpeedMb = null;
      test.on('error', e => {
        console.log(chalk.white.bgRed('Speed test error'), chalk.red(e));
        reject(e);
      });
      test.on('downloadspeed', speed => {
        downloadSpeedMb = ((speed * 125) / 1000).toFixed(2);
      });
      test.on('uploadspeed', speed => {
        uploadSpeedMb = ((speed * 125) / 1000).toFixed(2);
      });
      test.on('done', () => {
        console.log(
          chalk.blue(`\nDownload: ${downloadSpeedMb} MB/s`),
          chalk.blue(`\nUpload: ${uploadSpeedMb} MB/s`)
        );
        resolve(uploadSpeedMb);
      });
    });
  }
}

module.exports = Base;
