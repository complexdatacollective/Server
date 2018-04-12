const http = require('http');
const enzyme = require('enzyme');
const Adapter = require('enzyme-adapter-react-16');
const url = require('url');

enzyme.configure({ adapter: new Adapter() });

const jsonClient = {
  post: (uri, data) => jsonClient.request(uri, data),

  get: uri => jsonClient.request(uri),

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
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        const respBody = {
          statusCode: res.statusCode,
          json: JSON.parse(rawData),
        };
        if (res.statusCode === 200) {
          resolve(respBody);
        } else {
          reject(respBody);
        }
      });
    });
    if (reqData) { req.write(JSON.stringify(reqData)); }
    req.on('error', (err) => {
      console.warn('testClient error', err);
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
