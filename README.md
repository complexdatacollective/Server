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

|`npm run <script>`|Description|
|------------------|-----------|
|`start`|Serves your app at `localhost:3000`.|
|`server`| Starts the server listening at `localhost:8080`.|
|`build`|Compiles assets and prepares app for production in the /www directory.|
|`test`|Runs testing suite.|
|`build-docs`|Builds HTML API docs into the docs-build directory.|
|`electron`|Runs the current code in electron, for testing.|

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

New approach (work-in-progress):

1. `npm run start`: to start the webpack dev server
  - Note: must be running on port 3000.
2. `npm run start-electron` (in another terminal session)
  1. Copies the electron source to `./electron-dev`
  2. Runs the electron app from there, including background services.

Original approach:

To speed up development, the server can be run headlessly out of /src/worker using the command `npm run server:dev` and the UI can be viewed at `localhost:3000` once started with `npm run start`. Any changes made in the UI will be automatically compiled, but any changes made to the background server require it to be restarted in order for changes to be reflected.

## Application Structure

```
.
├── config             # Project and build configurations (webpack, env config)
├── public             # Static public assets to be bundled
└── src                # Application source code
    └── main           # Main Electron process
        └── worker     # Background process (node server)
    └── renderer       # GUI (react app)
```


## License
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fcodaco%2FServer.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Fcodaco%2FServer?ref=badge_large)
