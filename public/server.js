const io = require('socket.io');
const PrivateSocket = require('private-socket');
const levelup = require('levelup');

const db = levelup('./responses');

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
