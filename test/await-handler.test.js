const awaitHandler = require('../src/await-handler')

test('should resolve', async () => {
  expect.assertions(1)
  const arg = new Promise(resolve => {
    resolve('YAY!')
  })
  const [err, result] = await awaitHandler(arg)
  return expect(result).toBe('YAY!') && expect(err).toBe(null)
})

test('should reject', async () => {
  expect.assertions(1)
  const arg = new Promise((resolve, reject) => {
    reject('BOOM!')
  })
  const [err, result] = await awaitHandler(arg)
  return expect(result).toBe(undefined) && expect(err).toBe('BOOM!')
})

test('should throw when argument is not a promise', async () => {
  let error
  try {
    await awaitHandler('NOT_VALID_ARG')
  } catch (e) {
    error = e
  }
  expect(error.message).toMatch(/awaitHandler expects Promise as an argument/)
})
