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
  static setPort(port) {
    this.port = port;
  }

  get port() {
    return this.constructor.port || null;
  }

  checkPairingCodeExpired(pairingRequestId) {
    return this.head(`/pairing_requests/${pairingRequestId}`)
      .then((resp) => {
        let isExpired;
        if (resp.status === 404) { isExpired = true; }
        if (resp.status === 200) { isExpired = false; }
        // else (server error): undefined
        return {
          isExpired,
          expiresAt: resp.headers.get('expires'),
        };
      });
  }

  head(route) {
    return fetch(this.resolveRoute(route), { method: 'HEAD' });
  }

  /**
   * @param  {string} route
   * @return {Promise}
   */
  get(route) {
    return this.fetch(this.resolveRoute(route)).then(consumeResponse);
  }

  /**
   * @param  {string} route
   * @param  {Object} data will be JSON.stringified into the request body
   * @return {Promise}
   */
  post(route, data) {
    if (typeof data === 'string') {
      // Probably programming error; API will never accept top-level strings
      return Promise.reject(new Error('String not allowed as a JSON text'));
    }

    let json;
    try {
      json = JSON.stringify(data);
    } catch (err) {
      return Promise.reject(err);
    }

    return this.fetch(this.resolveRoute(route),
      {
        method: 'POST',
        body: json,
        headers: new Headers({ 'Content-Type': 'application/json' }),
      })
      .then(consumeResponse);
  }

  delete(route) {
    return this.fetch(this.resolveRoute(route),
      {
        method: 'DELETE',
      })
      .then(consumeResponse);
  }

  fetch(...args) {
    if (!this.port) {
      return Promise.reject(new Error('Admin API unavailable (no port set)'));
    }
    return fetch(...args);
  }

  resolveRoute(route) {
    const protocol = 'http';
    return `${protocol}://localhost:${this.port}/${route.replace(/^\//, '')}`;
  }
}

export default AdminApiClient;
