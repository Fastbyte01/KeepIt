const fs = require('fs');
const algolia = require('algoliasearch');
const Base = require('./Base.js');

class AddRulesScript extends Base {
  constructor() {
    super();
    // Bind class methods
    this.getSource = this.getSource.bind(this);
    this.parseBatchRulesOptions = this.parseBatchRulesOptions.bind(this);
    this.start = this.start.bind(this);
    // Define validation constants
    this.message =
      '\nExample: $ algolia addrules -a algoliaappid -k algoliaapikey -n algoliaindexname -s sourcefilepath -p batchRulesParams\n\n';
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
      throw new Error('Source filepath must target valid rules file.');
    return filepath;
  }

  parseBatchRulesOptions(params) {
    try {
      const options = { forwardToReplicas: false, clearExistingRules: false };
      if (params === null) return options;
      else return JSON.parse(params);
    } catch (e) {
      throw e;
    }
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

      // Get rules
      const rulesPath = this.getSource(sourcefilepath);
      const rulesFile = await fs.readFileSync(rulesPath);
      const rules = JSON.parse(rulesFile);
      // Get options
      const batchRulesOptions = this.parseBatchRulesOptions(params);

      // Instantiate Algolia index
      const client = algolia(appId, apiKey);
      const index = client.initIndex(indexName);
      // Add rules
      const result = await index.batchRules(rules, batchRulesOptions);
      return console.log(result);
    } catch (e) {
      throw e;
    }
  }
}

const addRulesScript = new AddRulesScript();
module.exports = addRulesScript;
