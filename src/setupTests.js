const http = require('http');
const enzyme = require('enzyme');
const Adapter = require('enzyme-adapter-react-16');
const url = require('url');

enzyme.configure({ adapter: new Adapter() });

/**
 * HTTP Client for asserting response body formats.
 *
 * Response contains a (parsed) json prop, for example:
 *
 * {
 *   statusCode: 200,
 *   json: {
 *     "status": "ok",
 *     "data": {
 *       "item": "data from server"
 *     }
 *   }
 * }
 *
 * Also contains the raw (string) response body; not typically needed.
 */
const jsonClient = {
  post: (uri, data) => jsonClient.request(uri, data),

  get: uri => jsonClient.request(uri),

  delete: uri => jsonClient.request(uri, null, 'DELETE'),

  request: (uri, reqData, method) => (new Promise((resolve, reject) => {
    const reqMethod = method || (reqData ? 'POST' : 'GET');
    const options = {
      ...url.parse(uri.toString()),
      method: reqMethod,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    const req = http.request(options, (res) => {
      const isJson = res.headers['content-type'] === 'application/json';
      let stringData = '';
      res.on('data', (chunk) => { stringData += chunk.toString(); });
      res.on('end', () => {
        const respBody = {
          statusCode: res.statusCode,
          data: stringData,
        };
        if (isJson) {
          respBody.json = JSON.parse(stringData);
        }
        if (res.statusCode === 200) {
          resolve(respBody);
        } else {
          reject(respBody);
        }
      });
    });
    if (reqData) { req.write(JSON.stringify(reqData)); }
    req.on('error', (err) => {
      console.warn('testClient error', err); // eslint-disable-line no-console
      reject(err);
    });
    req.end();
  })),
};

const makeUrl = (pathInput, base) => (
  new URL(pathInput, base.replace('0.0.0.0', 'localhost'))
);

const Helpers = {
  jsonClient,
  makeUrl,
};

module.exports = Helpers;
