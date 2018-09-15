const scriptInjector = require('./script-injector')
const awaitHandler = require('./await-handler')

async function executeTestCase({ browser, testcase, options }) {
  const { globals, evaluate } = options

  return new Promise(async (resolve, reject) => {
    // open new page
    const [pupOpenPageErr, page] = await awaitHandler(browser.newPage())
    if (pupOpenPageErr) {
      reject(pupOpenPageErr)
    }

    // go to given url
    const [pupPageGoToErr] = await awaitHandler(
      page.goto(testcase.url, { waitUntil: 'load' })
    )
    if (pupPageGoToErr) {
      reject(pupPageGoToErr)
    }

    // inject scripts on page
    const [pageScriptInjectErr] = await awaitHandler(
      scriptInjector({
        page,
        scripts: options.injectScripts
      })
    )
    if (pageScriptInjectErr) {
      reject(pageScriptInjectErr)
    }

    // mutate global with specific ruleId
    const mutatedGlobals = {
      ...globals,
      ruleId: testcase.ruleId
    }
    // expose window level globals
    const [injectGlobalError] = await awaitHandler(
      page.evaluate(globals => {
        Object.keys(globals).forEach(key => {
          window[key] = globals[key]
        })
      }, mutatedGlobals)
    )
    if (injectGlobalError) {
      reject(injectGlobalError)
    }

    // evaluate given function in page context
    const [evaluateErr, result] = await awaitHandler(page.evaluate(evaluate()))
    if (evaluateErr) {
      reject(evaluateErr)
    }

    // shut down
    const [pageCloseErr] = await awaitHandler(page.close())
    if (pageCloseErr) {
      reject(pageCloseErr)
    }

    // resolve results
    resolve(result)
  })
}

module.exports = executeTestCase
