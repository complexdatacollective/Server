/* eslint-disable no-unused-expressions */


import EventEmitter from 'event-emitter';
import io from 'socket.io-client';
import PrivateSocket from 'private-socket';

class Server {
  constructor() {
    this.privateSocket = new PrivateSocket(io('http://localhost:8080'));
    this.discoverySocket = io('http://localhost:8080/disc');
    this.events = new EventEmitter();

    this.privateSocket.on('ready', () => {
      const publicKey = this.privateSocket.getKeys().publicKey;
      console.log(publicKey);
      this.requestServerStatus();
    });

    this.discoveryRequest();
    this.listen();
  }

  listen = () => {
    this.discoverySocket.on('unpairedDevice', (data) => {
      console.log('unpaired device', data);
    });

    this.privateSocket.on('SERVER_STATUS', (data) => {
      console.log('SERVER_STATUS', data);
      this.events.emit('SERVER_STATUS', data);
    });

    this.privateSocket.on('data', (data) => {
      console.log(data);
    });
  }

  on(...args) {
    this.events.on(...args);
  }

  discoveryRequest = () => {
    const req = {
      deviceName: 'device-name',
      protocol: 'protocol-name',
      reqDate: new Date(),
    };

    this.discoverySocket.emit('discoveryRequest', req, (data) => {
      console.log(req);
      console.log('normal', data);
    });
  }

  requestServerStatus = () => {
    console.log(this.privateSocket);
    this.privateSocket.socket.emit('REQUEST_SERVER_STATUS');
  }

  getKeySnippet = key => key.slice(400, 416)
}

export default Server;
