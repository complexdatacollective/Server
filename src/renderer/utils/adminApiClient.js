import EventEmitter from 'event-emitter';

const adminApiUrl = 'http://localhost:8080'; // FIXME

const getKeySnippet = key => key && key.slice(400, 416);

const resolveRoute = route => `${adminApiUrl}/${route.replace(/^\//, '')}`;

const post = (route, data) => {
  const json = JSON.stringify(data);
  return fetch(resolveRoute(route), {
    method: 'POST',
    body: json,
    headers: new Headers({ 'Content-Type': 'application/json' }),
  })
    .then(resp => resp.json());
};

const get = route => fetch(resolveRoute(route))
  .then(resp => resp.json());

class AdminApiClient {
  constructor() {
    this.events = new EventEmitter();
    this.get = get;
    this.post = post;
  }

  on(...args) {
    this.events.on(...args);
  }

  requestServerStatus() {
    return fetch(resolveRoute('health'))
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
