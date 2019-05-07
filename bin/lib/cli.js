////////////////////////////////////////////////////////////////////////////////
//
// The command-line interface.
//
////////////////////////////////////////////////////////////////////////////////

const fs = require('fs')
const path = require('path')

const clr = require('../../lib/clr')

class CommandLineInterface {

  // Initialise the command-line interface.
  initialise () {
    const commandLineOptions = require('minimist')(process.argv.slice(2), {boolean: true})
    const command = this.command(commandLineOptions)
    this.execute(command)
  }

  throwError(errorMessage) {
    console.log(`\n 🤯 ${errorMessage}\n`)
    throw new Error(errorMessage)
  }

  // Return the command given a command-line options object.
  command (commandLineOptions) {
    const positionalArguments = commandLineOptions._
    const positionalCommand = positionalArguments[0]

    // Note: important that we check for strict equality here since a command flag and a
    // ===== a named argument for some other command may have the same name. (e.g., web-server … --proxy flags
    //       a proxy command but web-server sync … --proxy=localhost:1313 specifies the proxy host to use
    //       for a sync command).
    const command = {
      isHelp: (commandLineOptions.h === true || commandLineOptions.help === true || positionalCommand === 'help'),
      isVersion: (commandLineOptions.version === true || commandLineOptions.v === true || positionalCommand === 'version'),
      isGlobal: (commandLineOptions.global === true || positionalCommand === 'global'),
      isProxy: (commandLineOptions.proxy === true || positionalCommand === 'proxy'),
      isSync: (commandLineOptions.sync === true || positionalCommand === 'sync'),
      isEnable: (commandLineOptions.enable === true || positionalCommand === 'enable'),
      isDisable: (commandLineOptions.disable === true || positionalCommand === 'disable'),
      isLogs: (commandLineOptions.logs === true || positionalCommand === 'logs'),
      isStatus: (commandLineOptions.status === true || positionalCommand === 'status'),
    //isLocal: is handled below.
    }

    // If we didn’t match a command, we default to local.
    let didMatchCommand = Object.values(command).reduce((p,n) => p || n)
    command.isLocal = (commandLineOptions.local || positionalCommand === 'local' || (positionalArguments.length <= 1 && !didMatchCommand))
    didMatchCommand = didMatchCommand || command.isLocal

    // Check if we matched a command and throw an error if we didn’t.
    if (!didMatchCommand) {
      this.throwError('Unknown command.')
    }

    const positionalCommandDidMatchCommand = ['version', 'help', 'local', 'global', 'proxy', 'sync', 'enable', 'disable', 'logs', 'status'].reduce((p, n) => p || (positionalCommand === n), false)

    // Save the commands arguments.
    command.positionalArguments = positionalCommandDidMatchCommand ? commandLineOptions._.slice(1) : commandLineOptions._

    // Remove the positional arguments from the command line options object and
    // save the remaining named arguments.
    delete commandLineOptions._
    command.namedArguments = commandLineOptions

    return command
  }

  // Returns the file to be required for the passed command.
  requirement (command) {
    let requirement = null
    Object.entries(command).some(theCommand => {
      if (theCommand[1] === true) {
        const commandName = theCommand[0].slice(2).toLowerCase()
        requirement = `../commands/${commandName}`
        return true
      }
    })
    return requirement
  }

  // Execute the requested command.
  execute (command) {

    const requirement = this.requirement(command)
    const options = this.options(command)

    if (requirement === null) {
      // No commands matched; display help.
      require ('../commands/help')
    } else {
      // Load and run the command.
      require(requirement)(options)
    }
  }


  // Return an options object given a command.
  options (command) {
    const options = {
      pathToServe: this.pathToServe(command),
      port: this.port(command)
    }
    Object.assign(options, this.proxyOptions(command))
    Object.assign(options, this.syncOptions(command))

    return options
  }


  // Display a syntax error.
  syntaxError(message = null) {
    const additionalMessage = message === null ? '' : ` (${message})`
    this.throwError(`Syntax error${additionalMessage}`)
  }


  // Return the path to serve (for server commands) or exit the app if it doesn’t exist.
  pathToServe (command) {
    const isServerCommand = command.isLocal || command.isGlobal || command.isEnable

    // Only relevant for server commands.
    if (!isServerCommand) {
      return null
    }

    if (command.positionalArguments.length > 1) {
      // Syntax error.
      this.syntaxError()
    }

    // If no path is passed, we serve the current folder.
    // If there is a path, we’ll serve that.
    let pathToServe = '.'

    if (command.positionalArguments.length === 1) {
      // e.g., web-server enable path-to-serve OR web-server --enable path-to-serve
      pathToServe = command.positionalArguments[0]
    }

    // Ensure the path actually exists.
    if (!fs.existsSync(pathToServe)) {
      this.throwError(`Error: could not find path ${pathToServe}`)
    }

    return pathToServe
  }


  // Return the requested port given a command or exit the app if it is invalid.
  port (command) {
    // If a port is specified, use it. Otherwise use the default port (443).
    let port = 443
    if (command.namedArguments.port !== undefined) {
      port = parseInt(command.namedArguments.port)
    }

    const inTheValidPortRange = 'between 0 and 49,151 inclusive'

    // Invalid port.
    if (isNaN(port)) {
      this.throwError(`Error: “${port}” is not a valid port. Try a number ${inTheValidPortRange}.`)
    }

    // Check for a valid port range
    // (port above 49,151 are ephemeral ports. See https://en.wikipedia.org/wiki/List_of_TCP_and_UDP_port_numbers#Dynamic,_private_or_ephemeral_ports)
    if (port < 0 || port > 49151) {
      this.throwError(`Error: specified port must be ${inTheValidPortRange}.`)
    }

    return port
  }


  // Return the proxy urls (http and ws) for a given host string.
  proxyUrls (host) {
    const proxyOptions = {}
    proxyOptions.proxyHttpURL = host

    if (proxyOptions.proxyHttpURL.startsWith('https://')) {
      // Cannot proxy HTTPS.
      this.throwError('Error: cannot proxy HTTPS.')
    }

    if (!proxyOptions.proxyHttpURL.startsWith('http://')) {
      proxyOptions.proxyHttpURL = `http://${proxyOptions.proxyHttpURL}`
    }

    proxyOptions.proxyWebSocketURL = proxyOptions.proxyHttpURL.replace('http://', 'ws://')

    return proxyOptions
  }


  // If the server type is proxy, return a proxy options object (and exit with an error if one is not provided).
  proxyOptions (command) {
    let proxyOptions = {proxyHttpURL: null, proxyWebSocketURL: null}

    if (command.isProxy) {
      if (command.positionalArguments.length < 1) {
        // A proxy path must be included.
        this.throwError('Error: you must supply a URL to proxy. e.g., web-server proxy http://localhost:1313')
      }
      if (command.positionalArguments.length > 1) {
        // Syntax error.
        this.syntaxError('Error: cannot have more than one positional argument in a proxy command.')
      }
      proxyOptions = this.proxyUrls(command.positionalArguments[0])
    }

    return proxyOptions
  }


  // Return a sync options object given a command.
  syncOptions (command) {
    //
    // Syntax:
    //
    //  1. web-server sync --host=<host> [--folder=<folder>] [--account=<account>] [--proxy=<proxy-host>]
    //  2. web-server sync <host>
    //  3. web-server sync <folder> --host=<host>
    //  4. web-server sync <folder> <host>
    //  5. web-server sync --to=<account>@<host>:/home/<account>/<folder> [--proxy=<proxy-host>]
    //  6. web-server sync <folder> --to=<account>@<host>:/home/<account>/<folder> [--proxy=<proxy-host>]
    //
    // Key: […] = optional, <…> = value placeholder.
    //

    const syncOptionsDerivedFromPositionalArguments = { syncLocalFolder: null, syncRemoteHost: null }

    const syncOptions = { syncRemoteConnectionString: null, syncLocalFolder: null, syncStartProxyServer: null, syncRemoteHost: null }

    if (command.isSync) {

      // Adds remote server --<option>s, if any, to the syncOptions object.
      const addNamedArguments = () => {
        function namedArgumentExists(namedArgument) {
          return typeof command.namedArguments[namedArgument] === 'string'
        }

        // Check for conflicts between positional arguments and named arguments
        // and fail if there are any.
        if (namedArgumentExists('to')) {
          if (syncOptionsDerivedFromPositionalArguments.syncRemoteHost !== null) {
            // Conflict: remote host specified as both a positional argument and within the --to option.
            this.syntaxError(`ambiguous sync options: please provide ${clr('either', 'italics')} the ${clr('to', 'cyan')} option or provide the remote host as a positional argument, but not both.`)
          } else if (namedArgumentExists('account') || namedArgumentExists('host') || namedArgumentExists('folder')) {
            // Conflict: --to option used alongside the --account, --host, or --folder arguments.
            this.syntaxError(`ambiguous sync options: please provide ${clr('either', 'italics')} the ${clr('to', 'cyan')} option or use ${clr('account', 'cyan')}/${clr('host', 'cyan')}/${clr('folder', 'cyan')} options but not both.`)
          } else {
            // Check that the passed string has correct syntax.
            const remoteConnectionStringSyntaxMatch = command.namedArguments.to.match(/(.*?)@(.*?):(.*?)$/)
            if (remoteConnectionStringSyntaxMatch === null) {
              this.syntaxError(`could not parse rsync connection string in ${clr('--to', 'yellow')} option (${clr(command.namedArguments.to, 'cyan')}). It should be in the form ${clr('account@host:/path/to/folder', 'cyan')}`)
            }

          // Helper: redundant but useful so we don’t have to parse the remote connection string again.
          syncOptions.syncRemoteHost = remoteConnectionStringSyntaxMatch[2]

            // No conflicts or syntax issues: set the remote connection string to the one provided.
            syncOptions.syncRemoteConnectionString = command.namedArguments.to
          }
        } else {
          // Construct the remote connection string.
          if (syncOptionsDerivedFromPositionalArguments.syncRemoteHost !== null && namedArgumentExists('host')) {
            this.syntaxError(`ambiguous sync options: please provide ${clr('either', 'italics')} the ${clr('host', 'cyan')} option or provide the remote host as a positional argument, but not both.`)
          }

          if (syncOptionsDerivedFromPositionalArguments.syncRemoteHost === null && !namedArgumentExists('host')) {
            // This should not happen.
            this.syntaxError(`remote ${clr('host', 'cyan')} not provided either using the ${clr('--host', 'yellow')} option or via a positional argument.`)
          }

          // The account to use is either what is set explicitly using the --account option
          // or defaults to the same account as the person has on their local machine.
          const _account = namedArgumentExists('account') ? command.namedArguments.account : process.env.USER
          const _host = namedArgumentExists('host') ? command.namedArguments.host : syncOptionsDerivedFromPositionalArguments.syncRemoteHost

          // Helper: redundant but useful so we don’t have to parse the remote connection string again.
          syncOptions.syncRemoteHost = _host

          // We expect the remote folder to be at /home/<account>/<folder> where <folder> either defaults
          // to the name of the current folder on the local machine or is overridden using the --folder option.
          // If you want to specify any arbitrary folder on the remote machine, provide the full rsync
          // connection string using the --to option.
          const remoteFolderPrefix = `/home/${_account}`
          const localFolderPath = path.resolve(syncOptionsDerivedFromPositionalArguments.syncLocalFolder)
          const localFolderFragments = localFolderPath.split(path.sep)
          const currentLocalFolderName = localFolderFragments[localFolderFragments.length-1]

          const _folder = namedArgumentExists('folder') ? `${remoteFolderPrefix}/${command.namedArguments.folder}` : `${remoteFolderPrefix}/${currentLocalFolderName}`

          syncOptions.syncRemoteConnectionString = `${_account}@${_host}:${_folder}`
        }

        // Add the local folder to sync. This should have been set before we reach this point.
        // Sanity check:
        if (syncOptionsDerivedFromPositionalArguments.syncLocalFolder === null) {
          throw new Error('Sanity check failed: syncOptionsDerivedFromPositionalArguments.syncLocalFolder should not be null.')
        }
        syncOptions.syncLocalFolder = syncOptionsDerivedFromPositionalArguments.syncLocalFolder

        // Ensure that the local folder exists.
        if (!fs.existsSync(syncOptions.syncLocalFolder)) {
          this.throwError(`Error: Folder not found (${clr(syncOptions.syncFolder, 'cyan')}).\n\n    Syntax:\tweb-server ${clr('sync', 'green')} ${clr('folder', 'cyan')} ${clr('domain', 'yellow')}\n    Command:web-server ${clr('sync', 'green')} ${clr(syncOptions.syncFolder, 'cyan')} ${clr(syncOptions.syncDomain, 'yellow')}`)
        }

        //
        // Add any remaining sync options that have been provided.
        //
        if (namedArgumentExists('proxy')) {
          syncOptions.syncStartProxyServer = true
          const proxyOptions = this.proxyUrls(command.namedArguments.proxy)
          Object.assign(syncOptions, proxyOptions)
        }

        // Debug. (That’s it, this is the syncOptions object we’ll be returning).
        // console.log('syncOptions', syncOptions)
      }

      if (command.positionalArguments.length === 0) {
        //
        // No positional arguments. Must at least specify either:
        //
        //  Syntax 1. host as a named argument (--host), or
        //  Syntax 5. the full rsync connection string using the --to named argument.
        //
        // Note: If the --to option is specified, it will override the host, folder,
        // ===== and account arguments (whether named or positional).
        //
        if (typeof command.namedArguments.to === 'string') {
          //
          // Syntax 5.
          //
          syncOptionsDerivedFromPositionalArguments.syncLocalFolder = '.'
        } else if (typeof command.namedArguments.host === 'string') {
          //
          // Syntax 1.
          //
          syncOptionsDerivedFromPositionalArguments.syncLocalFolder = '.'
        } else if (typeof command.namedArguments.to === 'string') {
          //
          // Syntax error.
          //
          this.syntaxError(`must specify either ${clr('host', 'cyan')} to sync to or provide full rsync connection string using ${clr('to', 'cyan')} option`)
        }
      } else if (command.positionalArguments.length === 1) {
        //
        // One argument is provided, if:
        //
        // Syntax 2: it is the local folder if --host is set.
        // Syntax 6: it is the local folder if --to is set.
        // Syntax 3: it is the host if --host is not set. The folder to sync is the current folder.
        //
        if (typeof command.namedArguments.host === 'string') {
          //
          // Syntax 2.
          //
          syncOptionsDerivedFromPositionalArguments.syncLocalFolder = command.positionalArguments[0]
        } else if (typeof command.namedArguments.to === 'string') {
          //
          // Syntax 6.
          //
          syncOptionsDerivedFromPositionalArguments.syncLocalFolder = command.positionalArguments[0]
        } else {
          //
          // Syntax 3.
          //
          syncOptionsDerivedFromPositionalArguments.syncRemoteHost = command.positionalArguments[0]
          syncOptionsDerivedFromPositionalArguments.syncLocalFolder = '.'
        }
      } else if (command.positionalArguments.length === 2) {
        //
        // Syntax 4: Two arguments provided. We interpret the first as the path of the
        // folder to serve and the second as the host.
        //
        syncOptionsDerivedFromPositionalArguments.syncLocalFolder = command.positionalArguments[0]
        syncOptionsDerivedFromPositionalArguments.syncRemoteHost = command.positionalArguments[1]
      } else {
        //
        // Syntax error: we can have at most two positional arguments.
        //
        this.syntaxError('too many arguments')
      }

      // Add any named arguments (--<option>) that may exist to the syncOptions object.
      addNamedArguments()
    }

    return syncOptions
  }
}

module.exports = new CommandLineInterface()
