/* eslint-disable no-unused-expressions */

import EventEmitter from 'event-emitter';
import io from 'socket.io-client';
import PrivateSocket from 'private-socket';

class Server {
  constructor() {
    this.privateSocket = new PrivateSocket(io('http://localhost:8080'));
    this.deviceSocket = io('http://localhost:8080/device');
    this.events = new EventEmitter();

    this.privateSocket.on('ready', () => {
      const publicKey = this.privateSocket.getKeys().publicKey;
      console.log(publicKey)  // eslint-disable-line
      this.requestServerStatus();
    });

    // this.discoveryRequest();
    // this.pairingRequest();
    this.listen();
  }

  listen = () => {
    this.deviceSocket.on('unpairedDevice', (data) => {
      console.log('unpaired device', data);  // eslint-disable-line
    });

    this.privateSocket.on('SERVER_STATUS', (data) => {
      const { uptime, ip, clients, publicKey } = JSON.parse(data);
      this.events.emit('SERVER_STATUS', {
        ip: ip.address,
        publicKey: this.getKeySnippet(publicKey),
        clients,
        uptime,
      });
    });

    this.privateSocket.on('data', (data) => {
      console.log(data);  // eslint-disable-line
    });
  }

  on(...args) {
    this.events.on(...args);
  }

  discoveryRequest = () => {
    const req = {
      deviceName: 'device-name',
      protocol: 'protocol-name',
      reqDate: Date.now(),
    };

    this.deviceSocket.emit('deviceDiscoveryRequest', req, (data) => {
      console.log(data); // eslint-disable-line
    });
  }

  pairingRequest = () => {
    const req = {
      deviceName: 'device-name',
      protocol: 'protocol-name',
      reqDate: Date.now(),
    };

    this.deviceSocket.emit('pairingRequest', req, (data) => {
      console.log(data);  // eslint-disable-line
    });
  }

  requestServerStatus = () => {
    this.privateSocket.socket.emit('REQUEST_SERVER_STATUS');
  }

  getKeySnippet = key => key.slice(400, 416)
}

export default Server;
