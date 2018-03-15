import EventEmitter from 'event-emitter';

const adminApiUrl = 'http://localhost:8080'; // FIXME

class AdminApiClient {
  constructor() {
    this.events = new EventEmitter();
    this.requestServerStatus();
  }

  on(...args) {
    this.events.on(...args);
  }

  requestServerStatus() {
    fetch(`${adminApiUrl}/health`)
      .then(resp => resp.json())
      .then(({ serverStatus }) => {
        if (serverStatus) {
          this.events.emit('SERVER_STATUS', serverStatus);
        }
      });
  }
}

export default AdminApiClient;
