const axios = require('axios')
const awaitHandler = require('./await-handler')

async function loadTestCases(config, mappedIds) {
  return new Promise(async (resolve, reject) => {
    const [err, response] = await awaitHandler(axios.get(config.TESTCASES_JSON))
    if (err) {
      reject(err)
    }

    // filter out test cases that have a mapping to rules to run
    const result = response.data[config.TESTCASES_KEY].filter(tc => {
      return mappedIds.includes(tc.ruleId)
    })

    // resolve
    resolve(result)
  })
}

module.exports = loadTestCases
