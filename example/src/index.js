const fs = require('fs')
const mdtable = require('markdown-table')
const axe = require('axe-core')
const axePath = require.resolve('axe-core')
const testRunner = require('../../src')

const skipTests = {
  ruleIds: [
    /**
     * Skipping because of below error
     * => Error: Execution context was destroyed, most likely because of a navigation.
     */
    'SC2-2-1+SC3-2-5-meta-refresh' // axe-core rule -> ['meta-refresh']
  ],
  testCases: [
    'SC2-4-2-page-has-title_inapplicable_example_1.html', // svg document cannot be tested for title
    'SC2-4-4-link-has-name_failed_example_8.html', // issue - https://github.com/auto-wcag/auto-wcag/issues/267
    'SC3-1-1-html-has-lang_inapplicable_example_1.html', // svg document cannot be tested for title
    'SC4-1-2-button-has-name_failed_example_2.html' // issue - https://github.com/auto-wcag/auto-wcag/issues/264
  ]
}

const rulesMap = {
  'SC1-1-1-image-has-name': ['image-alt'],
  'SC1-2-2-audio-captions': ['audio-caption'],
  'SC1-2-Video-description-track': ['video-description'],
  'SC2-4-2-page-has-title': ['document-title'],
  'SC2-4-4-link-has-name': ['link-name'],
  'SC3-1-1-html-has-lang': ['html-has-lang'],
  'SC3-1-1-html-lang-valid': ['html-lang-valid'],
  'SC3-1-1-html-xml-lang-match': ['html-xml-lang-mismatch'],
  'SC3-1-2-lang-valid': ['valid-lang'],
  'SC3-3-2-form-field-has-name': ['label'],
  'SC4-1-1-unique-id': [
    'duplicate-id',
    'duplicate-id-active',
    'duplicate-id-aria'
  ],
  'SC4-1-2-button-has-name': ['button-name'],
  'SC1-3-5-autocomplete-valid': ['autocomplete-valid'],
  'SC2-2-1+SC3-2-5-meta-refresh': ['meta-refresh']
}

const options = {
  // debug mode of puppeteer
  debug: false,
  // tests to skip
  skipTests,
  // scripts to inject into puppeteer
  injectScripts: [
    axePath // 1) inject axe-core
  ],
  // global variables injected in to puppeteer
  globals: {
    rulesMap
  },
  // method to run
  evaluate: () => {
    // run
    return () => {
      return new Promise((resolve, reject) => {
        function computeResult(result, tc) {
          const wcagVsAxeResultsMap = {
            'passed-passes': 'automated',
            'passed-violations': 'incorrect',
            'passed-incomplete': 'semi-automated',
            'passed-inapplicable': 'automated', // * issue - https://github.com/auto-wcag/auto-wcag/issues/265
            'failed-passes': 'incorrect',
            'failed-violations': 'automated',
            'failed-incomplete': 'semi-automated',
            'failed-inapplicable': 'incorrect',
            'inapplicable-passes': 'automated', // * issue - https://github.com/auto-wcag/auto-wcag/issues/265
            'inapplicable-violations': 'incorrect',
            'inapplicable-incomplete': 'incorrect',
            'inapplicable-inapplicable': 'automated'
          }
          const { passes, violations, incomplete, inapplicable } = result
          const wcagResult = [
            {
              key: 'passes',
              value: passes.length
            },
            {
              key: 'violations',
              value: violations.length
            },
            {
              key: 'incomplete',
              value: incomplete.length
            },
            {
              key: 'inapplicable',
              value: inapplicable.length
            }
          ].sort((a, b) => b.value - a.value)[0]
          const wcagResultKey =
            tc.expected === 'failed' && violations.length > 0
              ? 'violations'
              : wcagResult.key
          const key = `${tc.expected}-${wcagResultKey}`
          return wcagVsAxeResultsMap[key]
        }

        const fixture = document.querySelector(testcase.selector)
        const axeIds = rulesMap[testcase.ruleId]
        axe.run(
          document,
          {
            runOnly: {
              type: 'rules',
              values: axeIds
            }
          },
          (err, result) => {
            if (err) {
              reject(err)
            }
            const out = {
              ruleId: testcase.ruleId,
              testcaseUrl: testcase.url,
              testcaseStatus: computeResult(result, testcase)
            }
            resolve(out)
          }
        )
      })
    }
  }
}

function getCellStyle(status) {
  const map = {
    automated: 'background-color: lightseagreen; color: black; padding: 4px;',
    'semi-automated': 'background-color: orange; color: black; padding: 4px;',
    incorrect: 'background-color: red; color: white; padding: 4px;'
  }
  return map[status]
}

// util fn
function getRuleStatus(ruleTestCasesResults) {
  const anyIncorrect = ruleTestCasesResults.some(
    result => result.testcaseStatus === 'incorrect'
  )
  if (anyIncorrect) {
    return 'incorrect'
  }

  const anySemiAutomated = ruleTestCasesResults.some(
    result => result.testcaseStatus === 'semi-automated'
  )
  if (anySemiAutomated) {
    return 'semi-automated'
  }

  return 'automated'
}

// write file
async function writeFile(filename, data) {
  await fs.writeFile(filename, data, err => {
    if (err) {
      throw new Error(err)
    }
    return true
  })
}

// write results
async function writeResults(filename, results) {
  const groupedResults = results.reduce((out, testcaseResult) => {
    if (!out[testcaseResult.ruleId]) {
      out[testcaseResult.ruleId] = []
    }
    out[testcaseResult.ruleId].push(testcaseResult)
    return out
  }, {})

  const finalResult = Object.keys(groupedResults).reduce(
    (out, ruleGroupKey) => {
      out.push({
        ruleId: ruleGroupKey,
        axeIds: rulesMap[ruleGroupKey],
        ruleStatus: getRuleStatus(groupedResults[ruleGroupKey]),
        testCaseResults: groupedResults[ruleGroupKey]
      })
      return out
    },
    []
  )

  await writeFile(filename, JSON.stringify(finalResult, null, 2))
  return finalResult
}

function makeResultsTable(data) {
  const tableData = [
    [
      'Auto-WCAG Rule Id',
      'Axe-Core Rule Id',
      'Rule Status',
      'Test Cases Results'
    ] //headers
  ]
  data.forEach(ruleData => {
    const row = []
    row.push(ruleData.ruleId)
    row.push(ruleData.axeIds)
    row.push(
      `<span style='${getCellStyle(ruleData.ruleStatus)}'> ${
        ruleData.ruleStatus
      } </span>`
    )
    row.push(
      ruleData.testCaseResults.reduce((out, result) => {
        const line = `<div style='display: block; margin: 4px'> <span style='${getCellStyle(
          result.testcaseStatus
        )}'>${result.testcaseStatus}</span> <a href='${result.testcaseUrl}'>${
          result.testcaseUrl.split('/').reverse()[0]
        }</a> </div>`

        if (!out.length) {
          out = line
          return out
        }

        out = `${out} <br> ${line}`
        return out
      }, ``)
    )
    tableData.push(row)
  })
  const table = mdtable(tableData)
  writeFile('result.md', table)
}

// execute testRunner
testRunner(options)
  .then(async results => {
    const data = await writeResults('result.json', results)
    makeResultsTable(data)
  })
  .catch(error => {
    throw new Error(error)
  })
