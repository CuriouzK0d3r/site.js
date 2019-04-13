# Indie Web Server

![Screenshot of Indie Web Server in use](images/indie-web-server.jpeg)

__Indie Web Server is a secure and seamless [Small Tech](https://ar.al/2019/03/04/small-technology/) personal web server.__

  - Zero-configuration – It Just Works 🤞™.

  - Develop with automatically-provisioned locally-trusted TLS courtesy of [mkcert](https://github.com/FiloSottile/mkcert) seamlessly integrated via [Nodecert](https://source.ind.ie/hypha/tools/nodecert).

  - Test and deploy with automatically-provisioned globally-trusted TLS courtesy of [Let’s Encrypt](https://letsencrypt.org/) seamlessly integrated via [ACME TLS](https://source.ind.ie/hypha/tools/acme-tls) and [systemd](https://freedesktop.org/wiki/Software/systemd/). Your server will score an A on the [SSL Labs SSL Server Test](https://www.ssllabs.com/ssltest).

  __Note:__ Live deployments via startup daemons are only supported on Linux distributions with systemd.

## Install

Copy and paste the following commands into your terminal:

### Linux

```
wget https://ind.ie/web-server/linux/8.0.0.zip && unzip 8.0.0.zip && chmod +x web-server && sudo mv web-server /usr/local/bin/
```

### macOS

```
wget https://ind.ie/web-server/macos/8.0.0.zip && unzip 8.0.0.zip && chmod +x web-server && sudo mv web-server /usr/local/bin/
```

### Node.js

```sh
npm i -g @ind.ie/web-server
```

## Use

### Local

Start serving the current directory at https://localhost as a regular process using locally-trusted certificates:

```shell
$ web-server
```

### Global (ephemeral)

__Available on Linux and macOS only*__

Start serving the _site_ directory at your _hostname_ as a regular process using globally-trusted Let’s Encrypt certificates:

```shell
$ web-server global site
```

For example, use [ngrok](https://ngrok.com/) (Pro+) with a custom domain name that you set in your `hostname` file (e.g., in `/etc/hostname` or via `hostnamectl set-hostname <hostname>` or the equivalent for your platform). The first time you hit your server via your hostname it will take a little longer to load as your Let’s Encrypt certificates are being automatically provisioned by ACME TLS.

When you start your server using the `global` command, it will run as a regular process. It will not be restarted if it crashes or if you exit the foreground process or restart the computer.

\* Automatic hostname detection has not been implemented for Windows and so globally-trusted certificates will fail on that platform.

### Global (persistent)

__Available on Linux distributions with systemd (most Linux distributions, but [not these ones](https://sysdfree.wordpress.com/2019/03/09/135/) or on macOS/Windows).__

Start serving the _site_ directory at your _hostname_ as a daemon that is automatically run at system startup and restarted if it crashes:

```shell
$ sudo web-server enable site
```

The `enable` command sets up your server to start automatically when your server starts and restart automatically if it crashes. Requires superuser privileges on first run to set up the launch item.

For example, if you run the command on a connected server that has the ar.al domain pointing to it and `ar.al` set in _/etc/hostname_, you will be able to access the site at https://ar.al. The first time you hit it, it will take a little longer to load as your Let’s Encrypt certificates are being automatically provisioned by ACME TLS.

When the server is enabled, you can also use:

  - `disable`: Stop server and remove from startup.
  - `logs`: Display and tail server logs.
  - `status`: Display detailed server information (press ‘q’ to exit).

Indie Web Server uses the [systemd](https://freedesktop.org/wiki/Software/systemd/) to start and manage the daemon. Beyond the commands listed above that Indie Web Server supports natively (and proxies to systemd), you can make use of all systemd functionality via the `systemctl` and `journalctl` commands.

## Build and test from source

### Global Node.js module

```shell
# Clone and install.
git clone https://source.ind.ie/hypha/tools/web-server.git
cd web-server
npm i         # Install modules and development dependencies.
npm i -g .    # Install globally for access to the binary.

# Run unit tests.
npm test

# Serve the test site (visit https://localhost to view).
web-server test/site
```

__Note:__ for commands that require root privileges (i.e., `enable` and `disable`), Indie Web Server will automatically restart itself using sudo and Node must be available for the root account. If you’re using [nvm](https://github.com/creationix/nvm), you can enable this via:

```shell
# Replace v10.15.3 with the version of node you want to make available globally.
sudo ln -s "$NVM_DIR/versions/node/v10.15.3/bin/node" "/usr/local/bin/node"
sudo ln -s "$NVM_DIR/versions/node/v10.15.3/bin/npm" "/usr/local/bin/npm"
```

### Native binaries

```shell
# Clone and install.
git clone https://source.ind.ie/hypha/tools/web-server.git
cd web-server
npm i         # Install modules and development dependencies.

# Run unit tests.
npm test

# Build the native binaries
npm run build

# Serve the test site (visit https://localhost to view).
# e.g., To run the version 8.0.0 Linux binary:
dist/linux/8.0.0/web-server test/site
```

## Syntax

```shell
web-server [command] [folder] [options]
```

  * `command`: version | help | dev | test | enable | disable | logs | status
  * `folder`: Path of folder to serve (defaults to current folder).
  * `options`: Settings that alter server characteristics.

### Commands:

  * `version`: Display version and exit.
  * `help`: Display help screen and exit.
  * `local`: Start server as regular process with locally-trusted certificates.
  * `global`: Start server as regular process with globally-trusted certificates.

On Linux distributions with systemd, you can also use:

  * `enable`: Start server as daemon with globally-trusted certificates and add to startup.
  * `disable`: Stop server daemon and remove from startup.
  * `logs`: Display and tail server logs.
  * `status`: Display detailed server information.

If `command` is omitted, behaviour defaults to `local`.

### Options:

  * `--port=N`: Port to start the server on (defaults to 443).

All command-line arguments are optional. By default, Indie Web Server will serve your current working folder over port 443 with locally-trusted certificates.

If you want to serve a directory that has the same name as a command, you can specify the command in _options_ format. e.g., `web-server --enable logs` will start Indie Web Server as a startup daemon to serve the _logs_ folder.

When you use the `global` or `enable` commands, globally-trusted Let’s Encrypt TLS certificates are automatically provisioned for you using ACME TLS the first time you hit your hostname. The hostname for the certificates is automatically set from the hostname of your system (and the _www._ subdomain is also automatically provisioned).

## Native 404 → 302 support for an evergreen web

What if links never died? What if we never broke the Web? What if it didn’t involve any extra work? It’s possible. And easy. Just make your 404s into 302s.

Indie Web Server has native support for [the 404 to 302 technique](https://4042302.org) to ensure an evergreen web. Just serve the old version of your site (e.g., your WordPress site, etc.) from a different subdomain and tell Indie Web Server to forward any unknown requests on your new static site to that subdomain so that all your existing links magically work.

To do so, create a simple file called `4042302` in the root directory of your web content and add the URL of the server that is hosting your older content. e.g.,

### /4042302
```
https://the-previous-version-of.my.site
```

You can chain the 404 → 302 method any number of times to ensure that none of your links ever break without expending any additional effort to migrate your content.

For more information and examples, see [4042302.org](https://4042302.org).

## Custom error pages

![Screenshot of the custom 404 error page included in the unit tests](images/custom-404.png)

You can specify a custom error page for 404 (not found) and 500 (internal server error) errors. To do so, create a folder with the status code you want off of the root of your web content (i.e., `/404` and/or `/500`) and place at least an `index.html` file in the folder. You can also, optionally, put any assets you want to display on your error pages into those folders and load them in via relative URLs. Your custom error pages will be served with the proper error code and at the URL that was being accessed.

If you do not create custom error pages, the built-in default error pages will be displayed for 404 and 500 errors.

When creating your own servers (see [API](#API)), you can generate the default error pages programmatically using the static methods `WebServer.default404ErrorPage()` and `WebServer.default500ErrorPage()`, passing in the missing path and the error message as the argument, respectively to get the HTML string of the error page returned.

## API

Indie Web Server’s `createServer` method behaves like the built-in _https_ module’s `createServer` function. Anywhere you use `require('https').createServer`, you can simply replace it with `require('@ind.ie/web-server').createServer`.


### createServer([options], [requestListener])

  - __options__ _(object)_: see [https.createServer](https://nodejs.org/api/https.html#https_https_createserver_options_requestlistener). Populates the `cert` and `key` properties from the automatically-created [nodecert](https://source.ind.ie/hypha/tools/nodecert/) or Let’s Encrypt certificates and will overwrite them if they exist in the options object you pass in. If your options has `options.global = true` set, globally-trusted TLS certificates are obtained from Let’s Encrypt using ACME TLS.

  - __requestListener__ _(function)_: see [https.createServer](https://nodejs.org/api/https.html#https_https_createserver_options_requestlistener). If you don’t pass a request listener, Indie Web Server will use its default one.

    __Returns:__ [https.Server](https://nodejs.org/api/https.html#https_class_https_server) instance, configured with either locally-trusted certificates via nodecert or globally-trusted ones from Let’s Encrypt.

#### Example

```js
const webServer = require('@ind.ie/web-server')
const express = require('express')

const app = express()
app.use(express.static('.'))

const options = {} // to use globally-trusted certificates instead, set this to {global: true}
const server = webServer.createServer(options, app).listen(443, () => {
  console.log(` 🎉 Serving on https://localhost\n`)
})
```

### serve([options])

Options is an optional parameter object that may contain the following properties, all optional:

  - __path__ _(string)_: the directory to serve using [Express](http://expressjs.com/).static.

  - __callback__ _(function)_: a function to be called when the server is ready. If you do not specify a callback, you can specify the port as the second argument.

  - __port__ _(number)_: the port to serve on. Defaults to 443. (On Linux, privileges to bind to the port are automatically obtained for you.)

  - __global__ _(boolean)_: if true, globally-trusted Let’s Encrypt certificates will be provisioned (if necesary) and used via ACME TLS. If false (default), locally-trusted certificates will be provisioned (if necesary) and used using nodecert.

    __Returns:__ [https.Server](https://nodejs.org/api/https.html#https_class_https_server) instance, configured with either locally or globally-trusted certificates.


#### Examples

Serve the current directory at https://localhost using locally-trusted TLS certificates:

```js
const webServer = require('@ind.ie/web-server')
const server = webServer.serve()
```

Serve the current directory at your hostname using globally-trusted Let’s Encrypt TLS certificates:

```js
const webServer = require('@ind.ie/web-server')
const server = webServer.serve({global: true})
```

## Contributing

Indie Web Server is, by design, a zero-configuration personal web server for single-tenant web applications for and by individuals. As such, any new feature requests will have to be both fit for purpose and survive a trial by fire to be considered. (That is, this is [Small Tech](https://ar.al/2019/03/04/small-technology/), with the emphasis on _small_).

Please file issues and submit pull requests on the [Indie Web Server Github Mirror](https://github.com/indie-mirror/indie-web-server).

## Help wanted

For locally-trusted certificates, all dependencies are installed automatically for you if they do not exist if you have apt, pacman, or yum (untested) on Linux or if you have [Homebrew](https://brew.sh/) or [MacPorts](https://www.macports.org/) (untested) on macOS.

I can use your help to test Indie Web Server on the following platform/package manager combinations:

  - Linux with yum
  - macOS with MacPorts

Please [let me know how/if it works](https://github.com/indie-mirror/web-server/issues). Thank you!

## Thanks

  * [thagoat](https://github.com/thagoat) for confirming that [installation works on Arch Linux with Pacman](https://github.com/indie-mirror/https-server/issues/1).

  * [Tim Knip](https://github.com/timknip) for confirming that [the module works with 64-bit Windows](https://github.com/indie-mirror/https-server/issues/2) with the following behaviour: “Install pops up a windows dialog to allow adding the cert.”

  * [Run Rabbit Run](https://hackers.town/@nobody) for [the following information](https://hackers.town/@nobody/101670447262172957) on 64-bit Windows: “Win64: works with the windows cert install popup on server launch. Chrome and ie are ok with the site then. FF 65 still throws the cert warning even after restarting.”
