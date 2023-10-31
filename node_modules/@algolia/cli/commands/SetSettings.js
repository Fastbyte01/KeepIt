const fs = require('fs');
const algolia = require('algoliasearch');
const Base = require('./Base.js');

class SetSettingsScript extends Base {
  constructor() {
    super();
    // Bind class methods
    this.getSource = this.getSource.bind(this);
    this.parseSetSettingsOptions = this.parseSetSettingsOptions.bind(this);
    this.start = this.start.bind(this);
    // Define validation constants
    this.message =
      '\nExample: $ algolia setsettings -a algoliaappid -k algoliaapikey -n algoliaindexname -s sourcefilepath -p setsettingsparams\n\n';
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
      throw new Error('Source filepath must target valid settings file.');
    return filepath;
  }

  parseSetSettingsOptions(params) {
    try {
      const options = { forwardToReplicas: false };
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
      const sourceFilepath = program.sourcefilepath;
      const params = program.params || null;

      // Get index settings
      const settingsPath = this.getSource(sourceFilepath);
      const settingsFile = await fs.readFileSync(settingsPath);
      const settings = JSON.parse(settingsFile);
      // Get options
      const settingsOptions = this.parseSetSettingsOptions(params);

      // Instantiate Algolia index
      const client = algolia(appId, apiKey);
      const index = client.initIndex(indexName);
      // Set index settings
      const result = await index.setSettings(settings, settingsOptions);
      return console.log(result);
    } catch (e) {
      throw e;
    }
  }
}

const setSettingsScript = new SetSettingsScript();
module.exports = setSettingsScript;
