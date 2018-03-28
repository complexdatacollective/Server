import EventEmitter from 'event-emitter';

const adminApiUrl = 'http://localhost:8080'; // FIXME

const getKeySnippet = key => key && key.slice(400, 416);

class AdminApiClient {
  constructor() {
    this.events = new EventEmitter();
  }

  on(...args) {
    this.events.on(...args);
  }

  // eslint-disable-next-line class-methods-use-this
  get(route) {
    return fetch(`${adminApiUrl}/${route}`)
      .then(resp => resp.json());
  }

  requestServerStatus() {
    return fetch(`${adminApiUrl}/health`)
      .then(resp => resp.json())
      .then(({ serverStatus }) => {
        if (serverStatus) {
          const { uptime, ip, publicKey } = serverStatus;
          this.events.emit('SERVER_STATUS', {
            ip: ip && ip.address,
            publicKey: getKeySnippet(publicKey),
            uptime,
          });
        }
      });
  }
}

export default AdminApiClient;
