const axios = require('axios')

/**
 * Load test cases to execute
 * @param {Object} options options to load testcases
 * @property {Object} options.config configuration object passed to testrunner
 * @property {Object} options.rulesMap mapping of ACT testcase Ids to Test tool Ids
 * @property {Object} options.skipTests list of testcases to skip from the ACT testcases
 * @property {Array} options.runOnly only run these rules
 */
async function loadTestCases({ config, rulesMap, skipTests, runOnly }) {
  const {
    ruleIds: skipRuleIds,
    testCases: skipTestCases,
    fileExtensions: skipExtensions
  } = skipTests

  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios.get(config.TESTCASES_JSON)
      // filter out test cases that have a mapping to rules to run
      // const result = tcs.filter(

      const testCases = response.data[config.TESTCASES_KEY]

      const result = testCases
        .filter(({ url, ruleId }) => {
          if (runOnly && runOnly.length) {
            const testCaseFileName = url.split('/').reverse()[0]
            return runOnly.includes(testCaseFileName)
          }
          return true
        })
        .filter(({ url, ruleId }) => {
          const isMapped = Object.keys(rulesMap).includes(ruleId)
          const hasImplementedRules = isMapped ? rulesMap[ruleId].length : false
          const shouldSkipRule = skipRuleIds.includes(ruleId)
          const testCaseFileName = url.split('/').reverse()[0]
          const testCaseExtension = testCaseFileName.split('.').reverse()[0]
          const shouldSkipTestCase = skipTestCases.includes(testCaseFileName)
          const shouldSkipExtension = skipExtensions.includes(testCaseExtension)

          return (
            isMapped &&
            hasImplementedRules &&
            !shouldSkipRule &&
            !shouldSkipTestCase &&
            !shouldSkipExtension
          )
        })
      // resolve
      resolve(result)
    } catch (error) {
      reject(error)
    }
  })
}

module.exports = loadTestCases
