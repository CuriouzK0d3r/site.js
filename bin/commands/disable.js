//////////////////////////////////////////////////////////////////////
//
// Command: disable
//
// Disables the web server daemon (stops it and removes it
// from startup items).
//
//////////////////////////////////////////////////////////////////////

const fs = require('fs')
const childProcess = require('child_process')

const status = require('../lib/status')
const ensure = require('../lib/ensure')

function disable () {

  ensure.systemctl()

  const { isActive, isEnabled } = status()

  if (!isEnabled) {
    console.log('\n 👿 Server is not enabled. Nothing to disable. \n')
    process.exit(1)
  }

  ensure.root('disable')

  try {
    // Disable and stop the web server.
    childProcess.execSync('sudo systemctl disable web-server', {env: process.env, stdio: 'pipe'})
    childProcess.execSync('sudo systemctl stop web-server', {env: process.env, stdio: 'pipe'})
    try {
      // And remove the systemd service file we created.
      fs.unlinkSync('/etc/systemd/system/web-server.service')
    } catch (error) {
      console.log(`\n 👿 Error: Web server disabled but could not delete the systemd service file (${error}).`)
    }
    console.log('\n 🎈 Server stopped and removed from startup.\n')
  } catch (error) {
    console.error(`\n 👿 Error: Could not disable web server (${error}).`)
    process.exit(1)
  }
}

module.exports = disable
