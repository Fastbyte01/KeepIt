const fs = require('fs');
const algolia = require('algoliasearch');
const Base = require('./Base.js');

class AddSynonymsScript extends Base {
  constructor() {
    super();
    // Bind class methods
    this.getSource = this.getSource.bind(this);
    this.parseBatchSynonymsOptions = this.parseBatchSynonymsOptions.bind(this);
    this.convertCsvToJson = this.convertCsvToJson.bind(this);
    this.start = this.start.bind(this);
    // Define validation constants
    this.message =
      '\nExample: $ algolia addsynonyms -a algoliaappid -k algoliaapikey -n algoliaindexname -s sourcefilepath -p batchSynonymsParams\n\n';
    this.params = [
      'algoliaappid',
      'algoliaapikey',
      'algoliaindexname',
      'sourcefilepath',
    ];
  }

  getSource(path) {
    const filepath = this.normalizePath(path);
    if (!fs.lstatSync(filepath).isFile())
      throw new Error('Source filepath must target valid synonyms file.');
    return filepath;
  }

  parseBatchSynonymsOptions(params) {
    try {
      const options = {
        forwardToReplicas: false,
        clearExistingSynonyms: false,
      };
      if (params === null) return options;
      else return JSON.parse(params);
    } catch (e) {
      throw e;
    }
  }

  convertCsvToJson(synonymFile, filepath) {
    const synonyms = synonymFile.toString().split('\n');
    return synonyms.map((line, num) => ({
      type: 'synonym',
      objectID: `${filepath}-${num}`,
      synonyms: line.split(','),
    }));
  }

  async start(program) {
    try {
      // Validate command; if invalid display help text and exit
      this.validate(program, this.message, this.params);

      // Config params
      const appId = program.algoliaappid;
      const apiKey = program.algoliaapikey;
      const indexName = program.algoliaindexname;
      const sourcefilepath = program.sourcefilepath;
      const params = program.params || null;
      const isCsv = sourcefilepath.split('.').pop() === 'csv';

      // Get synonyms
      const synonymsPath = this.getSource(sourcefilepath);
      const synonymsFile = await fs.readFileSync(synonymsPath);
      const synonyms = isCsv
        ? this.convertCsvToJson(synonymsFile, sourcefilepath)
        : JSON.parse(synonymsFile);

      // Get options
      const batchSynonymsOptions = this.parseBatchSynonymsOptions(params);

      // Instantiate Algolia index
      const client = algolia(appId, apiKey);
      const index = client.initIndex(indexName);
      // Add rules
      const result = await index.batchSynonyms(synonyms, batchSynonymsOptions);
      return console.log(result);
    } catch (e) {
      throw e;
    }
  }
}

const addSynonymsScript = new AddSynonymsScript();
module.exports = addSynonymsScript;
