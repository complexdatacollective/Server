/* eslint-disable */

/**
 * basic scaling tests for nedb
 *
 * notes:
 * - Node Crashes on DB size >256MB because of serialization
 *   + e.g., will not init.
 *   + This won't be an issue "soon" on 64-bit machines
 *     + [as of Chromium: 62](https://stackoverflow.com/a/47781288)
 *     + [electron2.0.2 is at Chromium 61](http://electronjs.org)
 *   + Easy repro: set SessionCount to 30k and run.
 *     + or set to 15k and run twice. (auto-compaction not working as advertised?)
 *     + note that [lack of] compaction makes this worse, but with mostly immutable data, matters less?
 *   + Can get in a state where app would never [re-]start, but underlying data is uncorrupted.
 * - everything grows linearly with SessionCount (init, insert, find, count)
 *   + init & insert probably grow linearly with total size
 *   + find & inner counts probably depend on query
 * - insert is atomic, hits inherent serialization limit for a certain insert (string length)
 */
const fs = require('fs');
const SessionDB = require('../src/main/data-managers/SessionDB');

const resetDb = !process.env.SKIP_RESET;

const mbPerByte = 1024 * 1024;
const nsPerSec = 1e9;
const printResult = (taskDesc, result, hrtimeDiff) => {
  const ns = hrtimeDiff[0] * nsPerSec + hrtimeDiff[1];
  console.log(`[${(ns / nsPerSec).toLocaleString()}s]`, taskDesc, result);
}

const dbFile = 'perf-test-sessions.db';
let db;

function initDb() {
  const initDbTime = process.hrtime();
  return new Promise(resolve => {
    db = new SessionDB(dbFile, false, { onload: (err) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      printResult(`Initialized Database`, 1, process.hrtime(initDbTime));
      resolve();
    }});
  });
}

function buildMockData() {
  /**
   * https://github.com/codaco/Server/issues/107
   * 80k nodes + 850k edges across 4,500 participant interviews.
   *
   * Normal dist: 18 nodes, 180 edges per interview
   */
  const mockNode = {"uid":"person_3","type":"person","name":"Carlito","nickname":"Carl","age":"25","itemType":"NEW_NODE","stageId":"namegen1","promptId":"6cl","school_important":true,"id":1,"closenessLayout":{"x":0.35625,"y":0.6988888888888889}};
  const mockEdge = {"from":12,"to":11,"type":"friends"};

  const EdgesPerSession = 180;
  const NodesPerSession = 18;
  const SessionCount = 4500;

  const nodes = new Array(NodesPerSession);
  const edges = new Array(EdgesPerSession);
  nodes.fill(mockNode);
  edges.fill(mockEdge);

  // Change last edge's property so we can search for it
  edges[edges.length - 1].from = 13;

  const record = {nodes, edges};
  const mockRecords = new Array(SessionCount);
  mockRecords.fill(record);
  return mockRecords;
}

function clearDb() {
  return new Promise((resolve) => {
    db.db.remove({}, { multi: true }, (err, removed) => {
      if (err) console.error(err);
      resolve();
    })
  });
}

function insertDocs() {
  console.log('Generating mocks...');
  const mockRecords = buildMockData();
  console.log('ok');
  const insertTime = process.hrtime();
  const protocol = { _id: "GoOWVsT0tjDaNIK9" };
  return db.insertAllForProtocol(mockRecords, protocol)
    .then((docs) => {
      printResult(`Insert ${docs.length} sessions`, docs.length, process.hrtime(insertTime));
    })
    .catch(console.error);
}

function testCountSessions() {
  return new Promise((resolve) => {
    const time = process.hrtime();
    db.db.count({}, (err, count) => {
      if (err) console.error(err);
      if (count) printResult('Count all sessions', count, process.hrtime(time));
      resolve();
    });
  });
}

function testFilterByEdge() {
  return new Promise((resolve) => {
    const time = process.hrtime();
    db.db.find({ edges: { $elemMatch: {"from":13,"to": { $exists: true } ,"type":"friends"} } }, (err, docs) => {
      if (err) console.error(err);
      if (docs) printResult('Find all associations with known node at one end', docs.length, process.hrtime(time));
      resolve();
    });
  });
}

function testCountNodes() {
  return new Promise((resolve) => {
    const time = process.hrtime();
    db.db.find({ nodes: { $exists: true } }).projection({ 'nodes':1, _id: 0 }).exec((err, docs) => {
      if (err) console.error(err);
      if (docs) {
        const count = docs.reduce((count, doc) => count += doc.nodes.length, 0);
        printResult('Count all nodes in all documents', count, process.hrtime(time));
      }
      resolve();
    });
  });
}

function testCountNodesOnField() {
  return new Promise((resolve) => {
    const time = process.hrtime();
    // "__countable__" is a dummy field for the projection: we don't need to know anything about nodes other then their length
    // Suppressing return of full node objects speeds up count significantly
    db.db.find({ nodes: { $exists: true } }).projection({ 'nodes.__countable__':1, _id: 0 }).exec((err, docs) => {
      if (err) console.error(err);
      if (docs) {
        const count = docs.reduce((count, doc) => count += doc.nodes.__countable__.length, 0);
        printResult('Count all nodes in all documents (on field)', count, process.hrtime(time));
      }
      resolve();
    });
  });
}

function testCountEdges() {
  return new Promise((resolve) => {
    const time = process.hrtime();
    db.db.find({ nodes: { $exists: true } }).projection({ 'edges.__countable__':1, _id: 0 }).exec((err, docs) => {
      if (err) console.error(err);
      if (docs) {
        const count = docs.reduce((count, doc) => count += doc.edges.__countable__.length, 0);
        printResult('Count all edges in all documents (on field)', count, process.hrtime(time));
      }
      resolve();
    });
  });
}

function compactDB() {
  return new Promise((resolve) => {
    const time = process.hrtime();
    db.db.persistence.compactDatafile();
    db.db.once('compaction.done', (evt) => {
      printResult('Manual compaction', 'ok', process.hrtime(time));
      resolve();
    });
  });
}

function printDbSize() {
  const stats = fs.statSync(dbFile);
  console.log('DB size', `${(stats.size / mbPerByte).toLocaleString()}MB`);
}


function go() { return Promise.resolve(); }

console.log('Initializing DB...');
initDb()
  .then(resetDb? clearDb : go)
  .then(resetDb? insertDocs : go)
  .then(testCountSessions)
  .then(testFilterByEdge)
  .then(testCountNodes)
  .then(testCountNodesOnField)
  .then(testCountEdges)
  .then(printDbSize)
  .then(compactDB)
  .then(printDbSize)
  .catch(console.error)
  ;
