const { execFile } = require('child_process');
const path = require('path');
const neo4j = require('neo4j-driver').v1;
const { ipcMain } = require('electron');

// Start background Neo4j process
// const neo4jPath = path.join(__dirname, 'vendor', 'neo4j-community-3.2.1', 'bin', 'neo4j');
const neo4jPath = path.join('./', 'vendor', 'neo4j-community-3.2.1', 'bin', 'neo4j');

const child = execFile(neo4jPath, ['console'], (error, stdout, stderr) => {
  if (error) {
    throw error;
  }
  console.log(stdout);
});


ipcMain.on('NEO4J_QUERY', (event, arg) => {
  const session = driver.session();

  session
    .run(arg)
    .then(function (result) {
      event.sender.send('NEO4J_RESULT', result);
      session.close();
    })
    .catch(function (error) {
      event.sender.send('NEO4J_ERROR', error);
    });
});

// Create a driver instance, for the user neo4j with password neo4j.
// It should be enough to have a single driver per database per application.
var driver = neo4j.driver("bolt://localhost", neo4j.auth.basic("neo4j", "neo4j2"));

// Register a callback to know if driver creation was successful:
driver.onCompleted = function () {
  // proceed with using the driver, it was successfully instantiated
};

// Register a callback to know if driver creation failed.
// This could happen due to wrong credentials or database unavailability:
driver.onError = function (error) {
  console.log('Driver instantiation failed', error);
};
