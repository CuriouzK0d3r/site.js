# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Nothing yet.

## [1.0.7] - 2019-02-28

### Fixes

  - Fix regression with automatic privileged port binding on Linux.

## [1.0.6] - 2019-02-28

### Changed

  - Uses nodecert v1.0.5: certificates now work in Node.js (e.g., via https.get(), etc.).

### Added

  - Unit tests.

## [1.0.5] - 2019-02-27

### Added

  - API: you can now use https-server programmatically from your own Node.js apps. It exposes a `createServer` method that’s polymorphic with its namesake from the base `https` module and it provides a `serve` convenience method that uses Express to serve a static site at the passed directory and port (or the current directory at port 443 by default).

## [1.0.4] - 2019-02-26

### Changed

  - Uses nodecert v1.0.4 (with progress indication).

## [1.0.3] - 2019-02-26

### Added

  - Node.js is automatically privileged to bind to ports < 1024 (including the default TLS port of 443).

## [1.0.2] - 2019-02-25

### Changed

  - Uses nodecert v1.0.3 with seamless install on macOS as well as Linux.

## [1.0.1] - 2019-02-25

### Fixed

  - Actually serves the requested folder instead of a hardcoded one 🤦

### Added

  - Support for manually-specifying the port.

## [1.0.0] - 2019-02-25

Initial release.
