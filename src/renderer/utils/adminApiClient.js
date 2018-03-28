import EventEmitter from 'event-emitter';

const adminApiUrl = 'http://localhost:8080'; // FIXME

const getKeySnippet = key => key && key.slice(400, 416);

const resolveRoute = route => `${adminApiUrl}/${route.replace(/^\//, '')}`;

const consumeResponse = resp => (
  resp.json()
    .then((respJson) => {
      if (resp.ok) {
        return respJson;
      }
      const errJson = respJson;
      errJson.message = errJson.message || 'Server error';
      throw errJson;
    })
);

/**
 * @memberof AdminApiClient.prototype
 * @param  {string} route
 * @param  {Object} data will be JSON.stringified into the request body
 * @return {Promise}
 */
const post = (route, data) => {
  let json;
  try {
    json = JSON.stringify(data);
  } catch (err) {
    return Promise.reject(err);
  }

  return fetch(resolveRoute(route),
    {
      method: 'POST',
      body: json,
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    .then(consumeResponse);
};

/**
 * @memberof AdminApiClient.prototype
 * @param  {string} route
 * @return {Promise}
 */
const get = route => fetch(resolveRoute(route))
  .then(consumeResponse);

/**
 * @class AdminApiClient
 *
 * @description
 * Restful API client for desktop (GUI) services.
 *
 * `post()` and `get()` methods each return a Promise.
 *
 * If the server response is 2xx, the promise resolves;
 * if the server responds with an error status, the promise rejects.
 *
 * The promised value contains the server response. In the case of server error,
 * the value will contain a `message` property, with a short description of the problem.
 */
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
