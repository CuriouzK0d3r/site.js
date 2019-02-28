const test = require('tape')

const httpsServer = require('../index.js')
const https = require('https')

const indexHTML = "<!DOCTYPE html><html lang='en'><head><title>Test</title><body><h1>Test</h1></body></html>"


async function secureGet (url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      const statusCode = response.statusCode
      if (statusCode !== 200) {
        reject({statusCode})
      }

      let body = ''
      response.on('data', _ => body += _)
      response.on('end', () => {
        resolve({statusCode, body})
      })
    })
  })
}


test('create server', t => {
  t.plan(2)
  const server = httpsServer.createServer()
  t.ok(server instanceof https.Server, 'https.Server instance is returned')

  server.listen(443, () => {
    t.equal(server.address().port, 443, 'the requested port is set')
    t.end()
    server.close()
  })
})


test('static serve', t => {
  t.plan(2)
  const server = httpsServer.serve('test/site', 443, async () => {

    let response
    try {
      response = await secureGet('https://localhost/index.html')
    } catch (error) {
      console.log(error)
      process.exit(1)
    }

    t.equal(response.statusCode, 200, 'request succeeds')
    t.equal(response.body, indexHTML, 'index loads')
    t.end()

    server.close()
  })
})