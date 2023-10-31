const algolia = require('algoliasearch');
const Base = require('./Base.js');

class TransferIndexScript extends Base {
  constructor() {
    super();
    // Bind class methods
    this.getIndices = this.getIndices.bind(this);
    this.getTransformations = this.getTransformations.bind(this);
    this.transferIndexConfig = this.transferIndexConfig.bind(this);
    this.transferData = this.transferData.bind(this);
    this.start = this.start.bind(this);
    // Define validation constants
    this.message =
      '\nExample: $ algolia transferindex -a sourcealgoliaappid -k sourcealgoliaapikey -n sourcealgoliaindexname -d destinationalgoliaappid -y destinationalgoliaapikey -i destinationindexname -t transformationfilepath -e true\n\n';
    this.params = [
      'sourcealgoliaappid',
      'sourcealgoliaapikey',
      'sourcealgoliaindexname',
      'destinationalgoliaappid',
      'destinationalgoliaapikey',
    ];
  }

  getIndices(options) {
    // Instantiate Algolia indices
    const sourceClient = algolia(options.sourceAppId, options.sourceApiKey);
    const sourceIndex = sourceClient.initIndex(options.sourceIndexName);
    const destinationClient = algolia(
      options.destinationAppId,
      options.destinationApiKey
    );
    const destinationIndex = destinationClient.initIndex(
      options.destinationIndexName
    );

    return { sourceIndex, destinationIndex };
  }

  getTransformations(options) {
    // Set JSON record transformations
    const transformations = options.transformations
      ? require(options.transformations)
      : null;
    // Validate transformations function input param
    const valid = transformations && typeof transformations === 'function';
    // Return provided transformation function if exists
    return valid ? transformations : null;
  }

  async transferIndexConfig(indices, options) {
    // Transfer settings, synonyms, and query rules
    const settings = await indices.sourceIndex.getSettings();
    const synonyms = await indices.sourceIndex.exportSynonyms();
    const rules = await indices.sourceIndex.exportRules();
    if (options.excludeReplicas) delete settings.replicas;
    await indices.destinationIndex.setSettings(settings);
    await indices.destinationIndex.batchSynonyms(synonyms);
    await indices.destinationIndex.batchRules(rules);
  }

  transferData(indices, formatRecord) {
    return new Promise((resolve, reject) => {
      // Export index
      const browse = indices.sourceIndex.browseAll('', {
        attributesToRetrieve: ['*'],
      });
      let hitsCount = 0;
      // Set browseAll event handlers
      browse.on('result', async result => {
        // Push hits to destination index
        try {
          const hits = formatRecord
            ? result.hits.map(formatRecord)
            : result.hits;
          await indices.destinationIndex.addObjects(hits);
          hitsCount += result.hits.length;
          this.writeProgress(`Records transferred: ${hitsCount}`);
        } catch (e) {
          throw e;
        }
      });
      browse.on('end', () => resolve('\nDone transferring index.\n'));
      browse.on('error', err => reject(err));
    });
  }

  async start(program) {
    try {
      // Validate command; if invalid display help text and exit
      this.validate(program, this.message, this.params);

      // Config params
      const options = {
        sourceAppId: program.sourcealgoliaappid,
        sourceApiKey: program.sourcealgoliaapikey,
        sourceIndexName: program.sourcealgoliaindexname,
        destinationAppId: program.destinationalgoliaappid,
        destinationApiKey: program.destinationalgoliaapikey,
        destinationIndexName:
          program.destinationindexname || program.sourcealgoliaindexname,
        transformations: program.transformationfilepath || null,
        excludeReplicas:
          program.excludereplicas !== undefined
            ? program.excludereplicas === 'true'
            : false,
      };

      // Configure Algolia clients/indices
      const indices = this.getIndices(options);
      // Configure transformations
      const formatRecord = this.getTransformations(options);
      // Transfer index configuration
      await this.transferIndexConfig(indices, options);
      // Transfer data
      const result = await this.transferData(indices, formatRecord);

      return console.log(result);
    } catch (e) {
      throw e;
    }
  }
}

const transferIndexScript = new TransferIndexScript();
module.exports = transferIndexScript;
