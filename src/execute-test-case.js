const scriptInjector = require('./script-injector')

/**
 * Mount a given set of values as globals on the Page
 * @param {Object} page Page or Window object on which the globals have to be mounted
 * @param {Object} globals Key Value Pair of globals to mount on the Page
 */
async function injectGlobals(page, globals) {
  const keys = Object.keys(globals)
  await Promise.all(keys.map(async (key) => {
    const value = globals[key]
    if (typeof value === 'function') {
      await page.exposeFunction(key, value)
    }
    if (typeof value !== 'function') {
      await page.evaluate(async function (object) {
        return window[object.key] = object.value
      }, { key, value })
    }
  }))
}

/**
 * Execute given test case
 * @param {Object} param meta data used to execute an ACT testcase
 * @property {Object} param.browser Puppeteer browser object
 * @property {Object} param.testcase ACT testcase
 * @property {Object} param.options opts 
 */
async function executeTestCase({ browser, testcase, options }) {
  const { globals, evaluate } = options

  return new Promise(async (resolve, reject) => {

    try {
      // open new page
      const page = await browser.newPage()

      // go to given url
      await page.goto(testcase.url, { waitUntil: 'load' })

      // inject scripts on page
      await scriptInjector({
        page,
        scripts: options.injectScripts
      })

      // mutate global with testcase object
      globals['testcase'] = testcase

      // expose window level globals
      const globalVarsAndFns = Object.keys(globals).reduce(
        (out, key) => {
          if (typeof globals[key] === 'function') {
            out.functions[key] = globals[key]
          }
          if (typeof globals[key] !== 'function') {
            out.variables[key] = globals[key]
          }
          return out
        },
        { variables: {}, functions: {} }
      )

      // inject global vars   
      await injectGlobals(page, globalVarsAndFns.variables)

      // expose functions as global
      await injectGlobals(page, globalVarsAndFns.functions)

      // evaluate given function in page context
      const results = await page.evaluate(evaluate)
      await page.close()

      // resolve results
      resolve(results)
    } catch (error) {
      reject(error)
    }
  })
}

module.exports = executeTestCase
