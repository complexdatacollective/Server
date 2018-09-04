# Network Canvas Server
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fcodaco%2FServer.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fcodaco%2FServer?ref=badge_shield)


A tool for storing, analyzing, and exporting Network Canvas interview data.

# Getting started

## Background

This application runs on Electron and consists of two parts (and a third spawned), which correlate to Electron's main/rendering processes:

1. `src/renderer`: The UI, which contains the configuration/export screens.
1. `src/main`: The main process, manages the tray and spawns a server process
1. `src/main/worker`: The background Server process which receives data and adds it to a store [storage is not yet implemented]

### 1. The UI

The UI is a React app which runs in Electron's BrowserWindow().

It is possible to test the UI by running `npm run start`, and viewing the various paths in your browser.

### 2. The server

The actual HTTP/Sockets server runs in a fork managed by the main process.

The main process itself acts a go-between for the UI and the server process.

## Installation

This repository assumes that `npm` is installed. If you don't have it installed, here are [installation instructions](https://docs.npmjs.com/getting-started/installing-node).

1. Clone this repo.
2. Go into the repo directory
3. Initialize submodules: `git submodule update --init`

|`npm run <script>`|Description|
|------------------|-----------|
|`start:electron`| Serves your app from a dev server on port `4000`.|
|`electron:dev`| Starts the main electron app including background services.|
|`build`|Compiles assets and prepares app for production in the /www directory.|
|`test`|Runs testing suite.|
|`build-docs`|Builds HTML API docs into the docs-build directory.|
|`electron`|Runs the current code in electron, for testing.|
|`preflight`|Run all linters, doc generators, and tests.|

Run `npm run` for a list of all available commands.

## Dependencies

### Node.js/NPM Versions

This project currently requires Node.js `8.9.3` to match the version used by Electron, and version `6.1.0` of npm.

** NOTE: ** npm 6.1.0 is not installed by default with Node 8.9.3. You will need to use `npm install -g npm@6.1.0` to do this. Test which version of npm you are using by typing `npm --version`.

### [MDNS](https://www.npmjs.com/package/mdns)

MDNS is used to advertise services to Network Canvas clients. On Windows and Linux, you'll need to install some dependencies first — see the [mdns installation instructions](https://www.npmjs.com/package/mdns#installation).

The [Network Canvas Readme](https://github.com/codaco/Network-Canvas#windows-environment) has detailed instructions for getting MDNS running on Windows.

## Running

To run the UI:

```sh
npm run build
npm run server
npm run start
```

To run the whole app (including server):

```sh
$ npm run build
$ npm run electron
```

The electron app (and server components) are served out of the /www folder. Changes can be made in the /src folder but won't reflect in the app until another build is completed (`npm run build && npm run electron`).

### Development workflow

1. `npm run start:electron`: to start the webpack dev server
  - Note: must be running on port 3000.
2. `npm run electron:dev` (in another terminal session)
  1. Copies the electron source to `./electron-dev`
  2. Runs the electron app from there, including background services.

### macOS Firewall during development

Electron.app runs an http server for device clients directly in the main process. If you've enabled your system Firewall, macOS will present an "Allow or Deny" dialog [every time the app is opened](https://support.apple.com/en-us/HT201642). If you have a [free] Apple developer account, you can work around this by signing the (development) app in node_modules.

```sh
cd ./node_modules/electron/dist
# This assumes you have an existing Mac Developer signing identity created by Xcode.
# If not, let it create one by building a new macOS app in Xcode.
# If the signing identity still isn't found, look in Xcode settings, or
# in Keychain's "My Certificates" for the name of a development cert.
codesign --force --sign "Mac Developer" --timestamp=none Electron.app --deep
```


## Application Structure

```
.
├── config             # Project and build configurations (webpack, env config)
    └── api            # Auto-generated API specs
    └── jest           # test setup files
├── public             # Static public assets to be bundled
└── src                # Application source code
    └── main           # Main Electron process
        └── server     # Services & APIs
    └── renderer       # GUI (react app)
```

## Tests

`config/jest/setupTestEnv` contains helpers which can be imported by tests.

`config/jest/setupTestFramework` contains the following custom matchers:

- `.toMatchErrorMessage(expectedMessage)`: Use to check that an object contains a "message" property with a string value that (partially) matches the `expectedMessage` string.

## JSDoc

By convention, all functions tagged with `@async` return a promise. The corresponding `@returns` and `@throws` tags document the corresponding resolved or rejected type.

## API docs for clients

The device API (for Network Canvas tablet & desktop clients) is currently being documented with [the OpenAPI spec](https://github.com/OAI/OpenAPI-Specification), a.k.a. Swagger. The spec is generated when the electron-dev target is built. To generate manually, run `node scripts/build-api-spec.js`.

For now, you'll have to generate API-specific documentation based on the spec. One way is to use [spectacle](https://github.com/sourcey/spectacle):

```sh
# install
npm install -g spectacle-docs

# publish to ./docs/api and start a server
spectacle --target-dir docs/api --development-mode --port 4400 config/api/api-spec-[version].json

# ...Now view at http://localhost:4400
```

## License
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fcodaco%2FServer.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Fcodaco%2FServer?ref=badge_large)
