function awaitHandler(promise) {
  try {
    return promise
      .then(data => {
        return [null, data]
      })
      .catch(err => [err])
  } catch (err) {
    throw new Error(
      'Log: TestRunner: awaitHandler expects Promise as an argument.',
      err
    )
  }
}

module.exports = awaitHandler
