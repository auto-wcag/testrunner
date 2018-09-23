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
    const [injectVariablesError] = await awaitHandler(
      page.evaluate(globals => {
        Object.keys(globals).forEach(key => {
          window[key] = globals[key]
        })
      }, globalVarsAndFns.variables)
    )
    if (injectVariablesError) {
      reject(injectVariablesError)
    }

    // expose functions as global
    const injectFnPromises = []
    Object.keys(globalVarsAndFns.functions).forEach(async key => {
      injectFnPromises.push(
        page.exposeFunction(key, globalVarsAndFns.functions[key])
      )
    })
    await Promise.all(injectFnPromises)

    // evaluate given function in page context
    const [evaluateErr, result] = await awaitHandler(page.evaluate(evaluate))
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
