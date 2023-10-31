# Algolia CLI

A Node CLI tool that makes it easy to perform common data manipulations and interactions with your Algolia app or indices.

- [Requirements](#requirements)
- [Install](#install)
- [Usage](#usage)
- [Commands](#commands)
- [Examples](#examples)
- [Contribute](#contribute)

# Requirements

- [Node.js](https://nodejs.org/)

# Install

- `npm install -g @algolia/cli`

# Usage

##### 📌 `algolia <COMMAND NAME> [OPTIONS]` 📌


```bash
$ algolia --help

$ algolia --version

$ algolia interactive

$ algolia search -a <algoliaAppId> -k <algoliaApiKey> -n <algoliaIndexName> -q <query> -p <searchParams> -o <outputPath>

$ algolia import -s <sourceFilepath> -a <algoliaAppId> -k <algoliaApiKey> -n <algoliaIndexName> -b <batchSize> -t <transformationFilepath> -m <maxconcurrency> -p <csvToJsonParams>

$ algolia export -a <algoliaAppId> -k <algoliaApiKey> -n <algoliaIndexName> -o <outputPath> -p <algoliaParams>

$ algolia getsettings -a <algoliaAppId> -k <algoliaApiKey> -n <algoliaIndexName>

$ algolia setsettings -a <algoliaAppId> -k <algoliaApiKey> -n <algoliaIndexName> -s <sourceFilepath> -p <setSettingsParams>

$ algolia addrules -a <algoliaAppId> -k <algoliaApiKey> -n <algoliaIndexName> -s <sourceFilepath> -p <batchRulesParams>

$ algolia exportrules -a <algoliaAppId> -k <algoliaApiKey> -n <algoliaIndexName> -o <outputPath>

$ algolia addsynonyms -a <algoliaAppId> -k <algoliaApiKey> -n <algoliaIndexName> -s <sourceFilepath> -p <batchSynonymsParams>

$ algolia exportsynonyms -a <algoliaAppId> -k <algoliaApiKey> -n <algoliaIndexName> -o <outputPath>

$ algolia transferindex -a <sourcealgoliaAppId> -k <sourcealgoliaApiKey> -n <sourcealgoliaIndexName> -d <destinationAlgoliaAppId> -y <destinationAlgoliaApiKey> -i <destinationIndexName> -t <transformationFilepath> -e <true|false>

$ algolia transferindexconfig -a <sourcealgoliaAppId> -k <sourcealgoliaApiKey> -n <sourcealgoliaIndexName> -d <destinationAlgoliaAppId> -y <destinationAlgoliaApiKey> -i <destinationIndexName> -p <configParams> -e <true|false>

$ algolia deleteindicespattern -a <algoliaAppId> -k <algoliaApiKey> -r '<regexp>' -x <true|false>

$ algolia transformlines -s <sourceFilepath> -o <outputPath> -t <transformationFilepath>

$ algolia examples
```

See also [additional examples](#examples).

# Commands

### 1. Help | `--help`

##### Description:

Get basic usage info for all provided CLI scripts.

##### Usage:

```shell
algolia --help
```

or

```
algolia -h
```

### 2. Version | `--version`

##### Description:

Get version info for npm package.

##### Usage:

```shell
algolia --version
```

or

```
algolia -v
```

### 3. Interactive | `interactive`

##### Description:

Use Algolia CLI in interactive mode. Get command and argument prompts.

##### Usage:

```shell
algolia interactive
```

### 4. Search | `search`

##### Description:

Search an Algolia index.

##### Usage:

```shell
algolia search -a <algoliaAppId> -k <algoliaApiKey> -n <algoliaIndexName> -q <query> -p <searchParams> -o <outputPath>
```

##### Options:

- `<algoliaAppId>` | Required
- `<algoliaApiKey>` | Required
- `<algoliaIndexName>` | Required
- `<query>` | Optional | Search query string to send to Algolia index. Defaults to `''`.
- `<searchParams>` | Optional | JSON params to be passed to Algolia `.search()` [method](https://www.algolia.com/doc/api-reference/api-methods/search/?language=javascript).
- `<outputPath>` | Optional | Local path where search results file will be saved.

##### Notes:

- If no `<outputPath>` is provided, command will simply console.log() the response.
- If an `<outputPath>` is provided, command will write a JSON file to that location.
- Provided `<outputPath>` path must include file name.
- See [search parameters](https://www.algolia.com/doc/api-reference/search-api-parameters/) for more documentation about search options.

### 5. Import | `import`

##### Description:

Import JSON or CSV data into Algolia index, from a file or directory of files.

You may also optionally apply custom transformations to each object indexed. CSV files will automatically be converted to JSON before transformations are applied.

Will handle arbitrarily large files without performance issues.

##### Usage:

```shell
algolia import -s <sourceFilepath> -a <algoliaAppId> -k <algoliaApiKey> -n <algoliaIndexName> -b <batchSize> -t <transformationFilepath> -m <maxConcurrency> -p <csvToJsonParams>
```

##### Options:

- `<sourceFilepath>` | Required | Path to a JSON or CSV file, or to a directory of such files.
- `<algoliaAppId>` | Required
- `<algoliaApiKey>` | Required
- `<algoliaIndexName>` | Required
- `<batchSize>` | Optional | Number of JSON objects to be included in each batch for indexing. Default is `5000`.
- `<transformationFilepath>` | Optional | The path to any file that exports a function which (1) takes 2 arguments; an object and a callback, then (2) ends by calling said callback with the 2 arguments `null` and `<YOUR_TRANSFORMED_OBJECT>`.
- `<maxConcurrency>` | Optional | Maximum number of concurrent filestreams to process. Default is `2`.
- `<csvToJsonParams>` | Optional | Stringified [Parser parameters](https://github.com/Keyang/node-csvtojson#parameters) object passed to [csvtojson](https://www.npmjs.com/package/csvtojson) module.

##### Example Transformation File:

See `transformations/example-transformations.js` for an extensive JSON object transformation example.

Simple transformation file example:
```javascript
module.exports = (data,cb) => {
  try {
    const record = Object.assign({}, data);
    record.objectID = data.product_id;
    record.score = Math.floor(Math.random() * 100);
    record.formattedNumber = parseInt(data.integer_formatted_as_string, 10);
    cb(null, record);
  } catch (e) {
    console.log('Transformation error:', e.message, e.stack);
    throw e;
  }
}
```

##### Notes:

- `<sourceFilepath>` may target a file or a directory of files.
- JSON files must contain an array of objects.
- CSV files must have a `.csv` extension.
- `<transformationFilepath>` requires a path to a transformation file. See [example file](transformations/example-transformations.js).
- Make sure you only import JSON or CSV files. Don't accidentally try to import hidden files like `.DS_Store`, log files, etc. as they will throw an error.
- Command assumes each file contains an array of JSON objects unless the file extension ends with `.csv`.
- CSV to JSON conversion performed using [csvtojson](https://www.npmjs.com/package/csvtojson) package.
- If no `<batchSize>` is explicitly provided, command will try to determine optimal batch size by estimating average record size, estimating network speed, and calculating a size that should work well given the concurrency.
- If command outputs a `AlgoliaSearchRequestTimeoutError` error, this means a batch of records failed to import. This typically occurs when attempting to import too much data over too slow a network connection. Command will automatically attempt to reduce `<batchSize>` to compensate, and re-try. If issues persist, consider reducing `<maxConcurrency>` and/or `<batchSize>`.
- If command outputs a `High memory usage` warning, it means the process is consuming a very high percentage of the estimated system heap allocation for the node process. Command will automatically attempt to reduce `<batchSize>` to compensate. If issues persist, consider reducing `<maxConcurrency>` and/or `<batchSize>`.

### 6. Export | `export`

##### Description:

Download all JSON records from a specific Algolia index.

##### Usage:

```shell
algolia export -a <algoliaAppId> -k <algoliaApiKey> -n <algoliaIndexName> -o <outputPath> -p <algoliaParams>
```

##### Options:

- `<algoliaAppId>` | Required
- `<algoliaApiKey>` | Required
- `<algoliaIndexName>` | Required
- `<outputPath>` | Optional | Path to an existing local directory where output files will be saved (filenames are autogenerated). If no output path is provided, defaults to current working directory.
- `<algoliaParams>` | Optional | JSON [Search params](https://www.algolia.com/doc/api-reference/search-api-parameters/) object passed to `browseAll()` [method](https://www.algolia.com/doc/api-reference/api-methods/browse/).

##### Notes:

- `<outputPath>` must be a directory.

### 7. Get Settings | `getsettings`

##### Description:

Get settings for a specific Algolia index.

##### Usage:

```shell
algolia getsettings -a <algoliaAppId> -k <algoliaApiKey> -n <algoliaIndexName>
```

##### Options:

- `<algoliaAppId>` | Required
- `<algoliaApiKey>` | Required
- `<algoliaIndexName>` | Required

##### Notes:

- To write settings JSON locally, just redirect the output to a file. For example:
`$ algolia getsettings -a EXAMPLE_APP_ID -k EXAMPLE_API_KEY -n EXAMPLE_INDEX_NAME > ~/Desktop/EXAMPLE_FILE_NAME.json`

### 8. Set Settings | `setsettings`

##### Description:

Set settings for a specific Algolia index.

##### Usage:

```shell
algolia setsettings -a <algoliaAppId> -k <algoliaApiKey> -n <algoliaIndexName> -s <sourceFilepath> -p <setSettingsParams>
```

##### Options:

- `<algoliaAppId>` | Required
- `<algoliaApiKey>` | Required
- `<algoliaIndexName>` | Required
- `<sourceFilepath>` | Required | Path to a JSON file containing a settings object.
- `<setSettingsParams>` | Optional | JSON object containing options passed to `setSettings()` [method](https://www.algolia.com/doc/api-reference/api-methods/set-settings/).

##### Example settings file:

```js
module.exports = {
  minWordSizefor1Typo: 4,
  minWordSizefor2Typos: 8,
  hitsPerPage: 20,
  maxValuesPerFacet: 100,
  version: 2,
  attributesToIndex: null,
  numericAttributesToIndex: null,
  attributesToRetrieve: null,
  unretrievableAttributes: null,
  optionalWords: null,
  attributesForFaceting: null,
  attributesToSnippet: null,
  attributesToHighlight: null,
  paginationLimitedTo: 1000,
  attributeForDistinct: null,
  exactOnSingleWordQuery: 'attribute',
  ranking:
   [ 'typo',
     'geo',
     'words',
     'filters',
     'proximity',
     'attribute',
     'exact',
     'custom' ],
  customRanking: null,
  separatorsToIndex: '',
  removeWordsIfNoResults: 'none',
  queryType: 'prefixLast',
  highlightPreTag: '<em>',
  highlightPostTag: '</em>',
  snippetEllipsisText: '',
  alternativesAsExact: [ 'ignorePlurals', 'singleWordSynonym' ]
};
```

##### Example setSettings params:

```
'{"forwardToReplicas":true}'
```
##### Notes:
- Any index setting parameter needs to be added directly in the file containing the settings object. See [Settings API paraameters documentation](https://www.algolia.com/doc/api-reference/settings-api-parameters/) to find the full list of index settings parameters.
- forwardToReplicas is currently the only option that can be passed to the settings method as an optional <setSettingsParams> argument.

### 9. Add Rules | `addrules`

##### Description:

Import a local JSON file of query rules to an Algolia index.

##### Usage:

```shell
algolia addrules -a <algoliaAppId> -k <algoliaApiKey> -n <algoliaIndexName> -s <sourceFilepath> -p <batchRulesParams>
```

##### Options:

- `<algoliaAppId>` | Required
- `<algoliaApiKey>` | Required
- `<algoliaIndexName>` | Required
- `<sourceFilepath>` | Required | Path to a JSON file containing an array of query rule objects.
- `<batchRulesParams>` | Optional | JSON object containing options passed to `batchRules()` [method](https://www.algolia.com/doc/api-reference/api-methods/batch-rules/).

##### Notes:

- See [batchRules documentation](https://www.algolia.com/doc/api-reference/api-methods/batch-rules/) and [implementing query rules documentation](https://www.algolia.com/doc/guides/managing-results/refine-results/merchandising-and-promoting/in-depth/implementing-query-rules/) for more info.

### 10. Export Rules | `exportrules`

##### Description:

Download all query rules from a specific Algolia index.

##### Usage:

```shell
algolia exportrules -a <algoliaAppId> -k <algoliaApiKey> -n <algoliaIndexName> -o <outputPath>
```

##### Options:

- `<algoliaAppId>` | Required
- `<algoliaApiKey>` | Required
- `<algoliaIndexName>` | Required
- `<outputPath>` | Optional | Local path where query rules file will be saved. If no output path is provided, defaults to current working directory.

##### Notes:

- `<outputPath>`path must include file name.

### 11. Add Synonyms | `addsynonyms`

##### Description:

Import a local CSV or JSON file of synonyms to an Algolia index. Some public synonym files can be downloaded from [this repository](https://github.com/algolia/synonym-dictionaries). Disclaimer: These are not intended to be all encompassing -- edits may be needed for your use case.

Note that if importing a CSV file, the expected format is file with no headers and with each row of comma-separated values being a group of synonyms for each other. For more information, read our [documentation](https://www.algolia.com/doc/guides/managing-results/optimize-search-results/adding-synonyms/how-to/managing-synonyms-from-the-dashboard/#csv) on the topic.

##### Usage:

```shell
algolia addsynonyms -a <algoliaAppId> -k <algoliaApiKey> -n <algoliaIndexName> -s <sourceFilepath> -p <batchSynonymsParams>
```

##### Options:

- `<algoliaAppId>` | Required
- `<algoliaApiKey>` | Required
- `<algoliaIndexName>` | Required
- `<sourceFilepath>` | Required | Path to a CSV or JSON file containing an array of synonyms objects.
- `<batchSynonymsParams>` | Optional | JSON object containing options passed to `batchSynonyms()` [method](https://www.algolia.com/doc/api-reference/api-methods/batch-synonyms/).

##### Notes:

- See [batchSynonyms documentation](https://www.algolia.com/doc/api-reference/api-methods/batch-synonyms/) and [adding synonyms documentation](https://www.algolia.com/doc/guides/managing-results/optimize-search-results/adding-synonyms/) for more info.

### 12. Export Synonyms | `exportsynonyms`

##### Description:

Download all synonyms from a specific Algolia index.

##### Usage:

```shell
algolia exportsynonyms -a <algoliaAppId> -k <algoliaApiKey> -n <algoliaIndexName> -o <outputPath>
```

##### Options:

- `<algoliaAppId>` | Required
- `<algoliaApiKey>` | Required
- `<algoliaIndexName>` | Required
- `<outputPath>` | Optional | Local path where synonyms file will be saved. If no output path is provided, defaults to current working directory.

##### Notes:

- `<outputPath>`path must include file name.

### 13. Transfer Index | `transferindex`

##### Description:

Transfer all data and settings (including synonyms and query rules) from one Algolia app/index to another.

##### Usage:

```shell
algolia transferindex -a <sourceAlgoliaAppId> -k <sourceAlgoliaApiKey> -n <sourceAlgoliaIndexName> -d <destinationAlgoliaAppId> -y <destinationAlgoliaApiKey> -i <destinationIndexName> -t <transformationFilepath> -e <excludeReplicas>
```

##### Options:

- `<sourceAlgoliaAppId>` | Required
- `<sourceAlgoliaApiKey>` | Required
- `<sourceAlgoliaIndexName>` | Required
- `<destinationAlgoliaAppId>` | Required
- `<destinationAlgoliaApiKey>` | Required
- `<destinationIndexName>` | Optional | If no destination index name is specified, script will default to creating a new index with the same name as the source index.
- `<transformationFilepath>` | Optional | The path to any file that exports a function which (1) takes a single object as argument, then (2) returns a transformed object.
- `<excludeReplicas>` | Optional | This is a boolean. When `true`, it will exclude the `replicas` setting when copying settings to the destination index. When `false`, it will copy the full settings object. Defaults to `false`.

##### Example Transformation File:

Simple transformation file for transferring an index:

```javascript
module.exports = (obj) => {
  try {
    const record = {};
    record.objectID = obj.product_id;
    record.score = Math.floor(Math.random() * 100);
    record.formattedNumber = parseInt(obj.integer_formatted_as_string, 10);
  } catch (e) {
    console.log('Transformation error:', e.message, e.stack);
    throw e;
  }
}
```

##### Notes:

- Command duplicates data and copies settings, synonyms, and rules; does not delete or affect source index.
- Command does NOT forward settings or synonyms to replicas.

### 14. Transfer Index Config | `transferindexconfig`

##### Description:

Transfer an index's settings, synonyms, and query rules to another index. Works even across indices in different Algolia applications.

##### Usage:

```shell
algolia transferindexconfig -a <sourceAlgoliaAppId> -k <sourceAlgoliaApiKey> -n <sourceAlgoliaIndexName> -d <destinationAlgoliaAppId> -y <destinationAlgoliaApiKey> -i <destinationIndexName> -p <configParams> -e <excludeReplicas>
```

##### Options:

- `<sourceAlgoliaAppId>` | Required
- `<sourceAlgoliaApiKey>` | Required
- `<sourceAlgoliaIndexName>` | Required
- `<destinationAlgoliaAppId>` | Required
- `<destinationAlgoliaApiKey>` | Required
- `<destinationIndexName>` | Optional | If no destination index name is specified, script will default to targetting an existing index with the same name as the source index.
- `<configParams>` | Optional | JSON object containing one or both of the following two properties: `batchSynonymsParams` and `batchRulesParams`. Each of those property values may contain a parameters object to be passed to the [batchSynonyms](https://www.algolia.com/doc/api-reference/api-methods/batch-synonyms/) and [batchRules](https://www.algolia.com/doc/api-reference/api-methods/batch-rules/) respectively.
- `<excludeReplicas>` | Optional | This is a boolean. When `true`, it will exclude the `replicas` setting when copying settings to the destination index. When `false`, it will copy the full settings object. Defaults to `false`.

##### Notes:

- When transferring synonyms and query rules, `forwardToReplicas`, `replaceExistingSynonyms`, and `clearExistingRules` params will default to false, unless you specify `<configParams>`.

### 15. Delete Indices Pattern | `deleteindicespattern`

##### Description:

Delete multiple indices at once (main or replica indices included) using a regular expression.

##### Usage:

```shell
algolia deleteindicespattern -a <algoliaAppId> -k <algoliaApiKey> -r '<regexp>' -x <dryrun>
```

##### Options:

- `<algoliaAppId>` | Required
- `<algoliaApiKey>` | Required
- `<regexp>` | Required | Provide regexes without the leading and trailing slashes
- `<dryrun>` | Required | This is a boolean. When `true` it will run in dry mode and show what will be deleted, when `false` it will really delete the indices. Careful!

##### Notes:

- The command handles replicas. First it update the settings of all main indices removing any replica that will match the regular expression. Then it will delete all matching indices (main and replica indices).

##### Example:

```shell
algolia deleteindicespattern -a someAppId -k someApiKey -r '^staging__' -x false
```

This will delete all indices of the application that are starting with "staging__".

### 16. Transform Lines | `transformlines`

##### Description:

Transform a file line-by-line.

##### Usage:

```shell
algolia transformlines -s <sourceFilepath> -o <outputPath> -t <transformationFilepath>
```

##### Options:

- `<sourceFilepath>` | Required | Path to a single `.js` or `.json` file OR a directory of such files.
- `<outputPath>` | Optional | Path to an existing local directory where output files will be saved (saved output filenames will match corresponding source filenames). If no output path is provided, defaults to current working directory.
- `<transformationFilepath>` | Optional | Path to file that exports a function which (1) takes a line string, and (2) returns a transformed line string.

##### Example use case:

Mapping each line of input file to a new output file.

Originally designed for converting `.json-seq` files to regular comma separated JSON arrays, in order to index them with the `import` cli tool.

##### Example Transformation File:

Let's say we had this source JSON file:
```json
[
  {"id":1,"color":"blue"},
  {"id":2,"color":"red"},
  {"id":3,"color":"green"}
]
```
and we wanted to filter out any objects that didn't have a "color" value of "blue". In this case, our transformations function could be something like this:
```javascript
module.exports = (line) => {
  if (line === '[' || line === ']') {
    return line;
  } else if (line.includes('"color":"blue"')) {
    return line;
  } else {
    return '\n';
  }
}
```

##### Notes:

- `<outputPath>` must be a directory.
- Running `transformlines` command without providing optional `<transformationFilepath>` param will cause it to assume it's parsing a `.json-seq` file; thus, it will apply the `defaultLineTransformation` method in `transformLines.js` to each line. This checks each line for the ASCII Record Separator character `\u001e` and replaces it with a `,`. It will _also_ cause it to enclose the whole file in "[" and "]" square brackets to make it a valid JS array. Providing a custom transformation method via the optional `<transformationFilepath>` param will make it exclusively run your transformation function instead of the default one (and in this case it will also omit adding enclosing square brackets).

### 14. Examples | `examples`

##### Description:

Display command usage examples.

##### Usage:

```shell
algolia examples
```

##### Notes:

- See equivalent list of [examples below](#examples).

# Examples
```bash
$ algolia --help

$ algolia --version

$ algolia interactive

$ algolia search -a EXAMPLE_APP_ID -k EXAMPLE_API_KEY -n EXAMPLE_INDEX_NAME -q 'example query' -p '{"facetFilters":["category:book"]}' -o ~/Desktop/results.json

$ algolia import -s ~/Desktop/example_source_directory/ -a EXAMPLE_APP_ID -k EXAMPLE_API_KEY -n EXAMPLE_INDEX_NAME -b 5000 -t ~/Desktop/example_transformations.js -m 4 -p '{"delimiter":[":"]}'

$ algolia export -a EXAMPLE_APP_ID -k EXAMPLE_API_KEY -n EXAMPLE_INDEX_NAME -o ~/Desktop/example_output_folder/ -p '{"filters":["category:book"]}'

$ algolia getsettings -a EXAMPLE_APP_ID -k EXAMPLE_API_KEY -n EXAMPLE_INDEX_NAME

$ algolia setsettings -a EXAMPLE_APP_ID -k EXAMPLE_API_KEY -n EXAMPLE_INDEX_NAME -s ~/Desktop/example_settings.json -p '{"forwardToReplicas":true}'

$ algolia addrules -a EXAMPLE_APP_ID -k EXAMPLE_API_KEY -n EXAMPLE_INDEX_NAME -s ~/Desktop/example_rules.json -p '{"forwardToReplicas":false,"clearExistingRules":true}'

$ algolia exportrules -a EXAMPLE_APP_ID -k EXAMPLE_API_KEY -n EXAMPLE_INDEX_NAME -o ~/Desktop/example_rules.json

$ algolia addsynonyms -a EXAMPLE_APP_ID -k EXAMPLE_API_KEY -n EXAMPLE_INDEX_NAME -s ~/Desktop/example_synonyms.json -p '{"forwardToReplicas":true,"clearExistingSynonyms":true}'

$ algolia exportsynonyms -a EXAMPLE_APP_ID -k EXAMPLE_API_KEY -n EXAMPLE_INDEX_NAME -o ~/Desktop/example_synonyms.json

$ algolia transferindex -a EXAMPLE_SOURCE_APP_ID -k EXAMPLE_SOURCE_API_KEY -n EXAMPLE_SOURCE_INDEX_NAME -d EXAMPLE_DESTINATION_APP_ID -y EXAMPLE_DESTINATION_API_KEY -i EXAMPLE_DESTINATION_INDEX_NAME -t ~/Desktop/example_transformations.js -e true

$ algolia transferindexconfig -a EXAMPLE_SOURCE_APP_ID -k EXAMPLE_SOURCE_API_KEY -n EXAMPLE_SOURCE_INDEX_NAME -d EXAMPLE_DESTINATION_APP_ID -y EXAMPLE_DESTINATION_API_KEY -i EXAMPLE_DESTINATION_INDEX_NAME -p '{"batchSynonymsParams":{"forwardToReplicas":true,"replaceExistingSynonyms":true},"batchRulesParams":{"forwardToReplicas":true,"clearExistingRules":true}}' -e true

$ algolia deleteindicespattern -a EXAMPLE_APP_ID -k EXAMPLE_API_KEY -r '^regex' -x true

$ algolia transformlines -s ~/Desktop/example_source_file.json -o ~/Desktop/example_output_folder/ -t ~/Desktop/example_transformations.js

$ algolia examples
```

# Contribute

## Requirements

- Node: `brew install node` or [Node docs](https://nodejs.org/en/)
- Yarn: `brew install yarn` or [Yarn docs](https://yarnpkg.com/lang/en/)

## Install

- Clone repo.
- `yarn install`
- Create `.env` file in project root and assign environment variables as listed [below](#environment-variables).

## Environment variables

- `ALGOLIA_TEST_APP_ID`
- `ALGOLIA_TEST_API_KEY`
- `ALGOLIA_TEST_INDEX_NAME`
- `ALGOLIA_TEST_ALT_APP_ID`
- `ALGOLIA_TEST_ALT_API_KEY`

## Develop
- Run `node index.js <command_name> [options]` to test various commands/options.
- Write code!
- Please use [git-flow](https://github.com/nvie/gitflow) and commit your changes on a feature branch, rebase it on develop branch before finishing the feature, then issue pull request to develop branch

## Tests
- `yarn test` to run full test suite locally
- `yarn test:unit` to run unit test suite only
- `yarn test:unit:watch` to run unit test suite with interactive `--watch` flag
- `yarn test:integration` to run integration test suite only

## Lint
- `yarn lint` to run eslint
- `yarn lint:fix` to run eslint with --fix flag
