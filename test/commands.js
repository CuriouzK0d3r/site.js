const test = require('tape')
const childProcess = require('child_process')

test('[bin/commands] version', t => {
  t.plan(1)

  const expectedOutputConcentrate = '💕Site.jsv12.11.0(runningonNodev10.16.0)╔═══════════════════════════════════════════╗║Likethis?Fundus!║║║║We’reatiny,independentnot-for-profit.║║https://small-tech.org/fund-us║╚═══════════════════════════════════════════╝'

  // Ensure that the command logs to console (as tests are being run with QUIET=true in the environment.)
  let env = Object.assign({}  , process.env)
  delete env['QUIET']

  const output = childProcess.execSync('site version', { env })

  t.strictEquals(output.toString('utf-8').replace(/\s/g,''), expectedOutputConcentrate, 'Command output is as expected')
  t.end()
})
