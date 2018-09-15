const awaitHandler = require('./await-handler')
const isUrl = require('is-url')

async function scriptInjector({ page, scripts = [] }) {
  return new Promise(async (resolve, reject) => {
    if (!scripts || !scripts.length) {
      resolve()
    }
    scripts.forEach(async (script, index) => {
      const key = isUrl(script) ? 'url' : 'path'
      const [err] = await awaitHandler(
        page.addScriptTag({
          [key]: script
        })
      )
      if (err) {
        reject(err)
      }
      if (index + 1 >= scripts.length) {
        resolve()
      }
    })
  })
}

module.exports = scriptInjector
