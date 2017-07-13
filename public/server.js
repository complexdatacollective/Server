/* eslint-disable no-console */

const io = require('socket.io');
const PrivateSocket = require('private-socket');
const level = require('level');

// level.destroy('./responses');

const db = level('./responses', { valueEncoding: 'json' });

// same as:
db.createReadStream({ keys: true, values: true })
  .on('data', ({ key, value }) => {
    console.log(key, ':', value);
  });

const createServer = (port) => {
  const server = io(port);

  console.log(`Server started on port ${port}.`);

  server.on('connect', (socket) => {
    console.log('Client connected.');
    const ps = new PrivateSocket(socket);
    console.log('Private socket established, listening...');

    ps.on('data', (data) => {
      db.put(new Date().getTime(), {
        type: 'response',
        data,
      }, (err) => {
        if (err) return console.log('Ooops!', err);
        return console.log('Saved', data);
      });
    });
  });

  return server;
};

if (require.main === module) {
  createServer(8081);
}

module.exports = createServer;
