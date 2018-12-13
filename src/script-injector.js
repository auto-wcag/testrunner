const isUrl = require('is-url')

/**
 * Inject an given set of scripts into the puppeteer page
 * @param {Object} param meta data constraining details of scripts to inject in the puppeteer page object
 * @property {Object} param.page puppeteer page
 * @property {Array} param.scripts array of scripts to inject into the page
 */
async function scriptInjector({ page, scripts = [] }) {
  return new Promise(async (resolve, reject) => {
    if (!scripts || !scripts.length) {
      resolve()
    }
    scripts.forEach(async (script, index) => {
      const key = isUrl(script) ? 'url' : 'path'
      try {
        await page.addScriptTag({ [key]: script })
      } catch (error) {
        reject(error)
      }
      if (index + 1 >= scripts.length) {
        resolve()
      }
    })
  })
}

module.exports = scriptInjector
