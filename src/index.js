import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';
import neo4j from 'neo4j';

const proto = 'bolt://';
const host = 'localhost:7474';
const user = 'neo4j';
const password = 'neo4j';

var db = new neo4j.GraphDatabase(`${proto}${user}:${password}@${host}`);

// db.cypher({
//     query: 'MATCH (u:User {email: {email}}) RETURN u',
//     params: {
//         email: 'alice@example.com',
//     },
// }, function (err, results) {
//     if (err) throw err;
//     var result = results[0];
//     if (!result) {
//         console.log('No user found.');
//     } else {
//         var user = result['u'];
//         console.log(JSON.stringify(user, null, 4));
//     }
// });
//
// resultPromise.then(result => {
//   session.close();
//
//   const singleRecord = result.records[0];
//   const node = singleRecord.get(0);
//
//   console.log(node.properties.name);
//
//   // on application exit:
//    driver.close();
//  });

ReactDOM.render(
  <App />,
  document.getElementById('root')
);
