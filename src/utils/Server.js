import EventEmitter from 'event-emitter';

const socket = new WebSocket('ws://localhost:8080');

class Server {
  constructor() {
    this.events = new EventEmitter();
    socket.addEventListener('message', (event) => {
      console.log('Message from server ', event.data);
      this.events.emit('SERVER_STATUS', event.data);
    });
  }

  on(...args) {
    this.events.on(...args);
  }

  requestServerStatus = () => {
    console.log('REQUESTING');
    // Connection opened
    socket.addEventListener('open', (event) => {
      console.log(event);
      socket.send('REQUEST_SERVER_STATUS');
    });
  }
}

export default Server;