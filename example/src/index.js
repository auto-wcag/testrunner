const fs = require('fs')
const axe = require('axe-core')
const axePath = require.resolve('axe-core')
const testRunner = require('../../src')

const rulesMap = {
  'SC1-3-5-autocomplete-valid': ['autocomplete-valid']
}

const options = {
  debug: false,
  // scripts to inject into puppeteer
  injectScripts: [
    'https://code.jquery.com/jquery-3.3.1.min.js',
    axePath // 1) inject axe-core
  ],
  // global variables injected in to puppeteer
  globals: {
    rulesMap
  },
  // method to run
  evaluate: () => {
    // run
    return () => {
      return new Promise((resolve, reject) => {
        axe.run(
          {
            runOnly: {
              type: 'rule',
              values: rulesMap[ruleId]
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

//execute
testRunner(options)
  .then(results => {
    fs.writeFile('output.json', JSON.stringify(results, null, 2), err => {
      if (err) {
        throw new Error(err)
      }
      console.log('Saved Results')
    })
    // console.log(results)
  })
  .catch(error => {
    throw new Error(error)
  })
