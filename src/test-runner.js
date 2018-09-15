const pkg = require('../package.json')
const puppeteer = require('puppeteer')
const loadTestCases = require('./load-test-cases')
const executeTestCase = require('./execute-test-case')
const awaitHandler = require('./await-handler')

async function testRunner(options) {
  const { debug = false, globals } = options
  if (!globals) {
    throw new Error(
      'Log: TestRunner: No `globals` object defined via configuration.'
    )
  }

  const { rulesMap = undefined } = globals
  if (!rulesMap) {
    throw new Error(
      'Log: TestRunner: No `rulesMap` object defined in `globals` via configuration.'
    )
  }

  const rulesMappedIds = Object.keys(rulesMap)
  if (!rulesMappedIds || !rulesMappedIds.length) {
    throw new Error(
      'Log: TestRunner: `rulesMap` does not contain `auto-wcag` rule id(s).'
    )
  }

  // get all auto-wcag testcases
  const [err, testcases] = await awaitHandler(
    loadTestCases(pkg.config, rulesMappedIds)
  )
  if (err) {
    throw new Error('Log: TestRunner: Error loading test cases. ', err)
  }

  if (!testcases || !testcases.length) {
    throw new Error(
      'Log: TestRunner: No test cases are defined. Ensure test cases are supplied.'
    )
  }

  // boot up puppeteer once
  const [pupErr, browser] = await awaitHandler(
    puppeteer.launch({
      ...(debug && {
        headless: false,
        slowMo: 100 * 5,
        devtools: true
      })
    })
  )
  if (pupErr) {
    throw new Error('Log: TestRunner: Unable to launch puppeteer.')
  }

  // run each test case
  const promises = []
  testcases.forEach(testcase => {
    promises.push(executeTestCase({ browser, testcase, options }))
  })

  // return
  return new Promise((resolve, reject) => {
    Promise.all(promises)
      .then(async results => {
        // close browser
        const [browserCloseErr] = await awaitHandler(browser.close())
        if (browserCloseErr) {
          reject(browserCloseErr)
        }
        // resolve
        resolve(results)
      })
      .catch(err => {
        reject(err)
      })
  })
}

module.exports = testRunner
