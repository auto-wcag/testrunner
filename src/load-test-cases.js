const axios = require('axios')
const awaitHandler = require('./await-handler')

async function loadTestCases(config, mappedIds, skipTests) {
  const { ruleIds: skipRuleIds, testCases: skipTestCases } = skipTests
  return new Promise(async (resolve, reject) => {
    const [err, response] = await awaitHandler(axios.get(config.TESTCASES_JSON))
    if (err) {
      reject(err)
    }

    // filter out test cases that have a mapping to rules to run
    const result = response.data[config.TESTCASES_KEY].filter(
      ({ url, ruleId }) => {
        const isMapped = mappedIds.includes(ruleId)
        const shouldSkipRule = skipRuleIds.includes(ruleId)

        const testCaseFileName = url.split('/').reverse()[0]
        const shouldSkipTestCase = skipTestCases.includes(testCaseFileName)

        return isMapped && !shouldSkipRule && !shouldSkipTestCase
      }
    )

    // resolve
    resolve(result)
  })
}

module.exports = loadTestCases
