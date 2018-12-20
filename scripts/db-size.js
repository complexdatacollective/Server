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
const uuidv4 = require('uuid/v4');
const SessionDB = require('../src/main/data-managers/SessionDB');

const resetDb = !process.env.SKIP_RESET;

const mbPerByte = 1024 * 1024;
const nsPerSec = 1e9;
const printResult = (taskDesc, result, hrtimeDiff) => {
  const ns = hrtimeDiff[0] * nsPerSec + hrtimeDiff[1];
  console.log(`[${(ns / nsPerSec).toLocaleString()}s]`, taskDesc, result);
}

const nodePrimaryKeyProperty = '_uid';

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

const EdgesPerSession = 180;
const NodesPerSession = 18;
const SessionCount = 4500;

const useRealIds = true;

function buildMockData({ sessionCount = SessionCount, edgesPerSession = EdgesPerSession, nodesPerSession = NodesPerSession, ...rest } = {}) {
  if (Object.keys(rest).length) {
    throw new Error(`Unknown options: ${Object.keys(rest)}`);
  }

  /**
   * https://github.com/codaco/Server/issues/107
   * 80k nodes + 850k edges across 4,500 participant interviews.
   *
   * Normal dist: 18 nodes, 180 edges per interview
   */
  const mockNode = {[nodePrimaryKeyProperty]:"person_3","type":"person","name":"Carlito","nickname":"Carl","age":"25","itemType":"NEW_NODE","stageId":"namegen1","promptId":"6cl","school_important":true,"id":2,"closenessLayout":{"x":0.35625,"y":0.6988888888888889}};
  const mockEdge = {"from":12,"to":11,"type":"friends"};

  const makeNetwork = (includeEgo = false) => {
    let nodes = new Array(nodesPerSession);
    let edges = new Array(edgesPerSession);
    nodes.fill(mockNode);
    edges.fill(mockEdge);

    // Change last edge's property so we can search for it
    edges[edges.length - 1].from = 13;

    if (useRealIds) {
      const pickNodeUid = () => nodes[~~(Math.random() * nodes.length)][nodePrimaryKeyProperty];
      nodes = nodes.map(node => ({ ...node, [nodePrimaryKeyProperty]: uuidv4(), age: ~~(Math.random() * 80) + 20 }))
      edges = edges.map(edge => ({ ...edge, from: pickNodeUid(), to: pickNodeUid() }))

      if (includeEgo) {
        nodes[0].id = 1;
      }
    }

    return { nodes, edges };
  }

  return [...Array(sessionCount)].map((r, i) => ({
    uuid: uuidv4(),
    data: makeNetwork(i == 0),
  }));
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
    db.db.find({ 'data.edges': { $elemMatch: {"from":13,"to": { $exists: true } ,"type":"friends"} } }, (err, docs) => {
      if (err) console.error(err);
      if (docs) printResult('Find all associations with known node at one end', docs.length, process.hrtime(time));
      resolve();
    });
  });
}

function testCountNodes() {
  return new Promise((resolve) => {
    const time = process.hrtime();
    db.db.find({ 'data.nodes': { $exists: true } }).projection({ 'data.nodes':1, _id: 0 }).exec((err, docs) => {
      if (err) console.error(err);
      if (docs) {
        const count = docs.reduce((count, doc) => count += doc.data.nodes.length, 0);
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
    db.db.find({ 'data.nodes': { $exists: true } }).projection({ 'data.nodes.__countable__':1, _id: 0 }).exec((err, docs) => {
      if (err) console.error(err);
      if (docs) {
        const count = docs.reduce((count, doc) => count += doc.data.nodes.__countable__.length, 0);
        printResult('Count all nodes in all documents (on field)', count, process.hrtime(time));
      }
      resolve();
    });
  });
}

function testCountEdges() {
  return new Promise((resolve) => {
    const time = process.hrtime();
    db.db.find({ 'data.edges': { $exists: true } }).projection({ 'data.edges.__countable__':1, _id: 0 }).exec((err, docs) => {
      if (err) console.error(err);
      if (docs) {
        const count = docs.reduce((count, doc) => count += doc.data.edges.__countable__.length, 0);
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

const variableRegistry = {
  // const mockNode = {
  // [nodePrimaryKeyProperty]:"person_3",
  // "type":"person",
  // "name":"Carlito",
  // "nickname":"Carl",
  // "age":"25",
  // "itemType":"NEW_NODE",
  // "stageId":"namegen1",
  // "promptId":"6cl",
  // "school_important":true,
  // "id":2,
  // "closenessLayout":{"x":0.35625,"y":0.6988888888888889}};
  node: {
    person: {
      name: 'person',
      label: 'Person',
      displayVariable: 'nickname',
      variables: {
        name: {
          "name": "name",
          "label": "Name",
          "description": "Human readable description",
          "type": "text",
          "validation": {
            "required": true,
            "minLength": 1,
            "maxLength": 24
          }
        },
        age: {
          "name": "age",
          "label": "Age",
          "description": "Human readable description",
          "type": "number",
          "validation": {
            "required": true,
            "minValue": 16,
            "maxValue": 100
          }
        },
        nickname: {
          "name": "nickname",
          "label": "Nickname",
          "description": "Human readable description",
          "type": "text",
          "validation": {
            "required": true,
            "minLength": 1,
            "maxLength": 8
          }
        },
        id: {
          name: "id",
          type: "text",
        },
        itemType: {
          name: "itemType",
          type: "text",
        },
        stageId: {
          name: "stageId",
          type: "text",
        },
        promptId: {
          name: "promptId",
          type: "text",
        },
        school_important: {
          "name": "school_important",
          "label": "school_important",
          "description": "Human readable description",
          "type": "boolean"
        },
        closenessLayout: {
          "name": "closenessLayout",
          "label": "Closeness layout",
          "description": "Closeness layout",
          "type": "layout"
        },
      }
    }
  },
  edge: {},
};

if (require.main === module) {
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
}

module.exports = {
  buildMockData,
  variableRegistry,
}
