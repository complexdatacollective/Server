import EventEmitter from 'event-emitter';
import io from 'socket.io-client';

class Server {
  constructor() {
    this.socket = io('http://localhost:8080', {
    });

    this.events = new EventEmitter();
    this.socket.on('SERVER_STATUS', (data) => {
      console.log('SERVER_STATUS', data);
      this.events.emit('SERVER_STATUS', data);
    });
    this.socket.on('discoveryUpdate', (data) => {
      console.log('update', data);
    });
  }

  on(...args) {
    this.events.on(...args);
  }

  requestServerStatus = () => {
    const req = {
      val: Math.floor(Math.random() * 10),
    };

    // // Connection opened
    this.socket.on('connect', () => {
      this.socket.emit('REQUEST_SERVER_STATUS');
      this.socket.emit('discoveryRequest', req, (data) => {
        console.log(req);
        console.log('normal', req.val, data);
      });
    });
  }
}

export default Server;
