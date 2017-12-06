import EventEmitter from 'event-emitter';
import io from 'socket.io-client';

class Server {
  constructor() {
    this.socket = io('http://localhost:8080');
    this.discoverySocket = io('http://localhost:8080/disc');

    this.events = new EventEmitter();
    this.socket.on('SERVER_STATUS', (data) => {
      console.log('SERVER_STATUS', data);
      this.events.emit('SERVER_STATUS', data);
    });

    this.discoverySocket.on('unpairedDevice', (data) => {
      console.log('unpaired device', data);
    });
  }

  on(...args) {
    this.events.on(...args);
  }

  requestServerStatus = () => {
    const req = {
      deviceName: 'device-name',
      protocol: 'protocol-name',
      reqDate: new Date(),
    };

    // // Connection opened
    this.socket.on('connect', () => {
      this.socket.emit('REQUEST_SERVER_STATUS');
      this.discoverySocket.emit('discoveryRequest', req, (data) => {
        console.log(req);
        console.log('normal', data);
      });
    });
  }
}

export default Server;
