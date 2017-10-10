import EventEmitter from 'event-emitter';

const socket = new WebSocket('ws://localhost:8080');

class Server {
  constructor() {
    this.events = new EventEmitter();
    socket.addEventListener('message', (event) => {
      this.events.emit('SERVER_STATUS', event.data);
    });
  }

  on(...args) {
    this.events.on(...args);
  }

  requestServerStatus = () => {
    // Connection opened
    socket.addEventListener('open', () => {
      socket.send('REQUEST_SERVER_STATUS');
    });
  }
}

export default Server;
