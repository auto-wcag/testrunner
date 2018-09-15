# TestRunner

This module exposes a wrapper `testRunner` around the [test cases](https://auto-wcag.github.io/auto-wcag/auto-wcag-testcases/testcases.json) for each of the [rules](https://auto-wcag.github.io/auto-wcag/pages/rules.html) in [Auto-WCAG](https://auto-wcag.github.io/auto-wcag/), thereby allowing to execute a given evaluation function against the test case as a document context.

## Usage of TestRunner

Code snippet, showing various ways to use the `testRunner`.

```js
const testRunner = require('testrunner')
// testrunner refers to file entry file `src/index.js`

// execute async
const results = await testRunner(config);

// or execute as a promise chain
testRunner(options)
  .then(results => {
    // explore results
  })
  .catch(error => {
    // handle error
  })
```

## Configuration Object for TestRunner

Members of the `config` object passed to the `testRunner`.

| Name | Type | Default Value | Description |
| --- | --- | --- |
| `config.debug` | `Boolean` | `false` | (Optional) Runs the `testRunner` in `debug` mode, which launches each test case page in a chromium (non-headless) mode |
| `config.injectScripts` | `Array<String>[]` | `undefined` | (Optional) A list of `path` or `url` of scripts to be injected into the `puppeteer` page context |
| `config.globals` | `Object` | `undefined` | (Mandatory) An object containing `key-value` pairs of variables to be mounted as a global variable in the `puppeteer` page context for usage by the `evaluate` function |
| `config.globals.rulesMap` | `Object` | - | (Mandatory) An object containing `key-value` pairs of `ruleId` of each `auto-wcag` rule mapped to a `uniqueId` of rule(s) to run against a chosen test tool |
| `config.evaluate` | `Function` | -` | (Mandatory) A function to be evaluate on the page context |

An example configuration object is as below:

```js
const axe = require('axe-core')
const axePath = require.resolve('axe-core')

const config = {
  debug: false,
  injectScripts: [
		'https://code.jquery.com/jquery-3.3.1.min.js',
    axePath
  ],
  globals: {
    rulesMap
  },
  evaluate: () => {
    return () => {
      return new Promise((resolve, reject) => {
        axe.run(
          {
            runOnly: {
              type: 'rule',
              values: rulesMap[ruleId] // Note `ruleId` is automatically injected as a global
            }
          },
          (err, result) => {
            if (err) {
              reject(err)
            }
            resolve(result)
          }
        )
      })
    }
  }
}
```

## Rules Mapping

To help define a `1 to 1` or `1 to Many` relationship between [Auto-WCAG rules] (https://auto-wcag.github.io/auto-wcag/pages/rules.html) and the test tool, an object of `key-value` pairs must be defined with the key `rulesMap` in the `config.globals`.

A sample template to build mappings, showing each of the [Auto-WCAG rules] (https://auto-wcag.github.io/auto-wcag/pages/rules.html) with their ids, can be [seen here](https://auto-wcag.github.io/auto-wcag/auto-wcag-testcases/rules.json)

An example mapping is as below:

```js
const rulesMap = {
  'SC1-3-5-autocomplete-valid': ['autocomplete-valid']
}
```

If no mapping is defined an error is thrown by the module.

## Development & Contributing

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)

Some notable libraries used to build this module are:

- [axios](https://www.npmjs.com/package/axios) for `XMLHttpRequest` management.
- [puppeteer](https://www.npmjs.com/package/puppeteer) for executing a given test case in a headless chromium page context.
- [jest](https://www.npmjs.com/package/jest) for testing.

For a full list of  dependencies refer [package.json](package.json)

### Directory Structure

- `src` directory contains the library code.
- `test` directory contains testing code.
- `example` directory shows a sample usage of the module.

### NPM Scripts

There is no `build` mechanism for this module. The entry point is set to `src/index.js`

- `npm run dev` runs `prettier` to format, then `lint`, then `test`, followed by `example` usage.
- `npm run lint` runs `eslint` across all `.js` files.
- `npm run test` runs test and reports coverage both in terminal and `coverage` directory.
- `npm run format` runs `prettier` on the code base to format to `standard` code style.

For a full list of scripts refer [package.json](package.json)
