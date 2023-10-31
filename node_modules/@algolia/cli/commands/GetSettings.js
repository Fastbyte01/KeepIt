const algolia = require('algoliasearch');
const Base = require('./Base.js');

class GetSettingsScript extends Base {
  constructor() {
    super();
    // Bind class methods
    this.start = this.start.bind(this);
    // Define validation constants
    this.message =
      '\nExample: $ algolia getsettings -a algoliaappid -k algoliaapikey -n algoliaindexname\n\n';
    this.params = ['algoliaappid', 'algoliaapikey', 'algoliaindexname'];
  }

  async start(program) {
    try {
      // Validate command; if invalid display help text and exit
      this.validate(program, this.message, this.params);

      // Config params
      const appId = program.algoliaappid;
      const apiKey = program.algoliaapikey;
      const indexName = program.algoliaindexname;

      // Instantiate Algolia index
      const client = algolia(appId, apiKey);
      const index = client.initIndex(indexName);
      // Get index settings
      const settings = await index.getSettings();
      return console.log(JSON.stringify(settings));
    } catch (e) {
      throw e;
    }
  }
}

const getSettingsScript = new GetSettingsScript();
module.exports = getSettingsScript;
