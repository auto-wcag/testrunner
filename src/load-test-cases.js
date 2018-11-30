const axios = require('axios')

/**
 * 
 * @param {Object} config configuration object passed to testrunner
 * @param {Object} mappedIds mapping of ACT testcase Ids to Test tool Ids
 * @param {Object} skipTests list of testcases to skip from the ACT testcases
 */
async function loadTestCases(config, mappedIds, skipTests) {
  const { ruleIds: skipRuleIds, testCases: skipTestCases, fileExtensions: skipExtensions  } = skipTests

  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios.get(config.TESTCASES_JSON)
      // filter out test cases that have a mapping to rules to run
      // const result = tcs.filter(

      const testCases = response.data[config.TESTCASES_KEY];
      const result = testCases.filter(
        ({ url, ruleId }) => {
          const isMapped = mappedIds.includes(ruleId)
          const shouldSkipRule = skipRuleIds.includes(ruleId)

          const testCaseFileName = url.split('/').reverse()[0]
          const testCaseExtension = testCaseFileName.split('.').reverse()[0]
          const shouldSkipTestCase = skipTestCases.includes(testCaseFileName)
          const shouldSkipExtension = skipExtensions.includes(testCaseExtension)

          return isMapped && !shouldSkipRule && !shouldSkipTestCase && !shouldSkipExtension
        }
      )
      // resolve
      resolve(result)
    } catch (error) {
      reject(error)
    }
  })
}

module.exports = loadTestCases
