const pkg = require('../package.json')
const puppeteer = require('puppeteer')
const loadTestCases = require('./load-test-cases')
const executeTestCase = require('./execute-test-case')

/**
 * Entry method for testrunner, asynchronously executes ACT testcases against a given test tool and retrieves results.
 * @param {Object} options configuration options for the testrunner
 */
async function testRunner(options) {
  console.log('TestRunner: Start.')

  const { debug = false, globals, skipTests } = options

  if (!globals) {
    throw new Error(
      'TestRunner: No `globals` object defined via configuration.'
    )
  }

  const { rulesMap = undefined } = globals
  if (!rulesMap) {
    throw new Error(
      'TestRunner: No `rulesMap` object defined in `globals` via configuration.'
    )
  }

  const rulesMappedIds = Object.keys(rulesMap)
  if (!rulesMappedIds || !rulesMappedIds.length) {
    throw new Error(
      'TestRunner: `rulesMap` does not contain `auto-wcag` rule id(s).'
    )
  }


  try {
    // get all auto-wcag testcases
    const testcases = await loadTestCases(pkg.config, rulesMappedIds, skipTests)

    if (!testcases || !testcases.length) {
      throw new Error(
        'TestRunner: No test cases are defined. Ensure test cases are supplied.'
      )
    }
    // boot up puppeteer once
    try {
      const browser = await puppeteer.launch({
        ...(debug && {
          headless: false,
          slowMo: 100 * 5,
          devtools: true
        })
      })


      // run each test case
      const promises = []
      testcases.forEach(testcase => {
        promises.push(executeTestCase({ browser, testcase, options }))
      })

      // return
      return new Promise((resolve, reject) => {
        Promise.all(promises)
          .then(async results => {
            console.log('TestRunner: End.')
            // close browser
            try {
              await browser.close()
            } catch (error) {
              throw new Error(error)
            }
            // resolve
            resolve(results)
          })
          .catch(err => {
            console.error('Error: TestRunner: End.', err)
            reject(err)
          })
      })
    } catch (error) {
      throw new Error('TestRunner: Unable to launch puppeteer.', error)
    }

  } catch (error) {
    throw new Error('TestRunner: Error loading test cases. ', error)
  }

}

module.exports = testRunner
