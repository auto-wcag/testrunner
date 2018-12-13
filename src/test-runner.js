const pkg = require('../package.json')
const puppeteer = require('puppeteer')
const loadTestCases = require('./load-test-cases')
const executeTestCase = require('./execute-test-case')

/**
 * Entry method for testrunner, asynchronously executes ACT testcases against a given test tool and retrieves results.
 * @param {Object} options configuration options for the testrunner
 */
async function testRunner(options) {
  process.setMaxListeners(Infinity)

  console.log('TestRunner: Start.')

  const { debug = false, globals, skipTests, runOnly } = options

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
    const testcases = await loadTestCases({
      config: pkg.config,
      rulesMap,
      skipTests,
      runOnly
    })

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

      // run each test case and collate results
      const results = []
      for (const [index, testcase] of testcases.entries()) {
        try {
          console.log(
            `Executing Testcase: ${index + 1} of ${
              testcases.length
            } \n Testcase URL: ${testcase.url} \n`
          )
          const testCaseResult = await executeTestCase({
            browser,
            testcase,
            options
          })
          results.push(testCaseResult)
        } catch (error) {
          throw ('Error: TestRunner: ', error)
        }
      }

      console.log('TestRunner: End.')
      return results
    } catch (error) {
      throw new Error('TestRunner: Unable to launch puppeteer.', error)
    }
  } catch (error) {
    throw new Error('TestRunner: Error loading test cases. ', error)
  }
}

module.exports = testRunner
