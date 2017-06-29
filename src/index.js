/*global electron, icpRenderer*/
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';

const { ipcRenderer } = window.require('electron');

ipcRenderer.on('NEO4J_RESULT', (event, arg) => {
  console.log(arg) // prints "pong"
});

ipcRenderer.on('NEO4J_ERROR', (event, arg) => {
  console.log('neo4j error', arg) // prints "pong"
})

var timer = setTimeout(() => {
  ipcRenderer.send('NEO4J_QUERY', 'MATCH (you {name:"You"})-[:FRIEND]->(yourFriends) RETURN you, yourFriends');
}, 5000);

ReactDOM.render(
  <App />,
  document.getElementById('root')
);
