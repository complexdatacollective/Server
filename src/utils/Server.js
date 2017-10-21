import EventEmitter from 'event-emitter';

class Server {
  constructor() {
    this.socket = new WebSocket('ws://localhost:8080');

    this.events = new EventEmitter();
    this.socket.addEventListener('message', (event) => {
      this.events.emit('SERVER_STATUS', event.data);
    });
  }

  on(...args) {
    this.events.on(...args);
  }

  requestServerStatus = () => {
    // Connection opened
    this.socket.addEventListener('open', () => {
      this.socket.send('REQUEST_SERVER_STATUS');
    });
  }
}

export default Server;
