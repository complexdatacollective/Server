import EventEmitter from 'event-emitter';
import io from 'socket.io-client';

class Server {
  constructor() {
    this.socket = io('http://localhost:8080', {
      path: '/rnd',
    });

    this.events = new EventEmitter();
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
      this.socket.emit('REQUEST_SERVER_STATUS', (data) => {
        console.log(data);
      });
      this.socket.emit('randomRequest', req, (data) => {
        console.log(req);
        console.log('normal', req.val, data);
      });
    });

    // this.socket.addEventListener('open', () => {
    //   this.socket.send('randomRequest');
    // });
  }
}

export default Server;
