// TODO: remove 'NODE_TLS_REJECT_UNAUTHORIZED=0' in the test script definition in package.json.
// Cert verification is disabled during tests for now to work around
// https://github.com/nodejs/node/issues/14736; fixed with Node 8.10.0.

const http = require('http');
const https = require('https');
const enzyme = require('enzyme');
const Adapter = require('enzyme-adapter-react-16');
const url = require('url');
const Writable = require('stream').Writable;

enzyme.configure({ adapter: new Adapter() });

const httpsCert = `-----BEGIN CERTIFICATE-----
MIIDGDCCAgCgAwIBAgIJC3Lf02c3V9WRMA0GCSqGSIb3DQEBCwUAMCUxIzAhBgNV
BAMTGk5ldHdvcmsgQ2FudmFzIChsb2NhbGhvc3QpMB4XDTE4MTAzMDE2NTAxMloX
DTI4MTAyNzE2NTAxMlowJTEjMCEGA1UEAxMaTmV0d29yayBDYW52YXMgKGxvY2Fs
aG9zdCkwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCDn11VuHeNldFU
bkZ309qte3vBtGj2eafdYRPaYgxB3c8+YTLK24PrO3LyIRBHfZOgG9yelULZg+qz
zPMDSLi0iKFnon/U0y12jH7EIAV63e8MSbPTy6ytng3wjRMSqkeq7z0cVZr3ny2w
ukBJTWPvS+l85ttUGKtAj5raRWuyg3jpDBeVQSlO/QJN+4bpyVVez4df6lZabVJX
ekkdZDtTwASi1wuM6//WhvXHGDwwkF9Wwh4s3MZpWDUXjgseLXR+fuZ1fIKRALOv
cFJYBNn7uMIkXLEsXNMWu178KrcQHtbg0LjYs3dtygCXse1nFBdZWSRel9HDw+z9
5D31EvTdAgMBAAGjSzBJMAwGA1UdEwQFMAMBAf8wCwYDVR0PBAQDAgL0MCwGA1Ud
EQQlMCOCCWxvY2FsaG9zdIcEfwAAAYcQAAAAAAAAAAAAAAAAAAAAADANBgkqhkiG
9w0BAQsFAAOCAQEABeZ9/blAxt7fO2Eaz0YsB2/BskK4omTs9zHYMh4LnQq3yAXI
JnnAY0WGXXf3xg6taQOUiZ8Puq5Bbg/W5MS6Br7gRBgORGEJTHug9aDEFwe1/7KJ
ldzwxk9nvjmWSClydKe9jSuqtjg2W0NTLrozRVMH+g2k0ahKcCRqpvl2538Uqslx
ZyWSMawCCegkIhLsiJVcnWmA9wHZUTuYqQ9nPMYeBYVFKMZH76C5FluUFs6V+mN9
KryTAjCchyUqtuLl42JJ+OkixY4RTc/P/dTlElY3Ng4oN4+JuauIpGzvN8EAQ9DI
pDCkeL8RCFY3IvfuZQ1ywu0RLisEMkBkp1jBIg==
-----END CERTIFICATE-----
`;

const httpsPrivateKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEogIBAAKCAQEAg59dVbh3jZXRVG5Gd9ParXt7wbRo9nmn3WET2mIMQd3PPmEy
ytuD6zty8iEQR32ToBvcnpVC2YPqs8zzA0i4tIihZ6J/1NMtdox+xCAFet3vDEmz
08usrZ4N8I0TEqpHqu89HFWa958tsLpASU1j70vpfObbVBirQI+a2kVrsoN46QwX
lUEpTv0CTfuG6clVXs+HX+pWWm1SV3pJHWQ7U8AEotcLjOv/1ob1xxg8MJBfVsIe
LNzGaVg1F44LHi10fn7mdXyCkQCzr3BSWATZ+7jCJFyxLFzTFrte/Cq3EB7W4NC4
2LN3bcoAl7HtZxQXWVkkXpfRw8Ps/eQ99RL03QIDAQABAoIBAA0z+TrWDDgJpTvg
6/StLaxlTJ67qCPBRFNyn3kyiKQ6ycUqHtw2dN8t0XP0WRuyvxI6eUD3HAORtgNf
NalIrC5/3iD1Lfl9TXwsz7KAu8v9YzNKWV2PerzXs/JDVHx01EeTRAAJnkfkkcK+
jCBOQQ4KAVvkFHA1IUiSnyfx+sGnRVm5JjBs2czPhUowcPCcAb8psHDH2rb/tNQx
yiVl3eNqzGX/QmJ+LcSAzTz7AAdha8/oH5bSoXwFvF5h/eZU1ADNuPIrVm8JvoCo
BEO7djIB/OS6lk8/kj9dQ088YHAByn7q8hZZ4uQHztRuR7v72uVytyfhtyEMtG81
M/BtY0ECgYEA0iG4YDok63rDhe1roENk4lMNl89MTbU5272r1PL1wwKN5eXog5pf
c8Oc0dgROl7KOzv4zuvIW6b6YjQdGb1+NNST+na2eKwmuPeU8fSK/8ReoJUt0NK9
6V31iJj6reY6XGynUFTixfUlvpom2ShtjuVWoZcWLvLKR5CxfcQQBOUCgYEAoFqB
b8xjkrvznwvWG2nXPAPp074W2WpOLwfUl94bKdbktkQ6I+DFFGtx5lZKVhLTzUqv
yKLkRg0WFCZAGXmAMdCiz/YyCc0rErC/2R3IIJCZLk3cH+ieJ15K1arGINMzRqJe
LGq88MsDoWMjBYO/k7IE+sXqMWO2YDE+J6JHaJkCgYBygBtWm/hINDHchX2y62ZK
iRUMFtIuOcUYPucl92oBZB/sGPY01+aRTxLhqYnhs4sg8dHm9sXLY1ZmMp10zDO8
F+W2gf92C+Bhw87udOFU8yzY9dDsTBld02wajblzDtPYTwBwnoCfe7CghqEKjaP9
TGyDSq+0z2l3y5lbvX05HQKBgHJogKdqlbSwox5cDJQcjPOF+0QXASh4P3YwyQ7d
6lWMvDwLK8xDZ3mtO2PTN1B4OGPloMuu5N3SImmX7O4AEWX5bOCh0IvLtaqtLwRS
ymHpqVEvPhoKFyURkqUmJhxvc8s2t6hLM6k9v8Za/DbIDFzti738jZ5VfV7eY3FV
yEspAoGAUrOOajWsOyZy3TwUmK/+kpJlKzD1KBv7IvlpxEJBk9aLfiO0Wxe5I+ob
GJirQb7wj+qIfwXZoGpXbHhXPssdK0lQ4NJe9k2wGZzDQ56Ev7WEm8SREr/0sAk6
VIdEq/jPXkKKCBRHhVMGmVdZwEBn2AnTx6DyM8OXZVaPn6sNFYY=
-----END RSA PRIVATE KEY-----
`;

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
const jsonClient = (useHttps) => {
  const agent = {
    post: (uri, data) => agent.request(uri, data),

    get: uri => agent.request(uri),

    delete: uri => agent.request(uri, null, 'DELETE'),

    head: uri => agent.request(uri, null, 'HEAD'),

    request: (uri, reqData, method) => (
      new Promise((resolve, reject) => {
        let client = http;
        const reqMethod = method || (reqData ? 'POST' : 'GET');
        const options = {
          ...url.parse(uri.toString()),
          method: reqMethod,
          headers: {
            'Content-Type': 'application/json',
          },
        };

        if (useHttps) {
          client = https;
          options.ca = httpsCert;
        }

        const req = client.request(options, (res) => {
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
            if ((/^2/).test(res.statusCode)) {
              resolve(respBody);
            } else {
              reject(respBody);
            }
          });
        });
        if (reqData) {
          if (typeof reqData === 'string') {
            // For testing: use raw string requests to assert failures for non-JSON payloads
            req.setHeader('Content-Type', 'text/plain');
          } else {
            req.setHeader('Content-Type', 'application/json');
            reqData = JSON.stringify(reqData); // eslint-disable-line no-param-reassign
          }
          req.write(reqData);
        }
        req.on('error', (err) => {
          console.warn('testClient error', err); // eslint-disable-line no-console
          reject(err);
        });
        req.end();
      })
    ),
  };
  return agent;
};

/**
 * @return {Stream.Writable} a writable stream, with an `asString()` method added for convenience
 */
const makeWriteableStream = () => {
  const chunks = [];

  const writable = new Writable({
    write(chunk, encoding, next) {
      chunks.push(chunk.toString());
      next(null);
    },
  });

  writable.asString = async () => new Promise((resolve, reject) => {
    writable.on('finish', () => { resolve(chunks.join('')); });
    writable.on('error', (err) => { reject(err); });
  });

  return writable;
};

const makeUrl = (pathInput, base) => (
  new URL(pathInput, base.replace('0.0.0.0', 'localhost').replace('[::]', 'localhost'))
);

const httpClient = jsonClient();
const secureClient = jsonClient(true);

const mockProtocol = {
  id: '1',
  filename: 'a.netcanvas',
  name: 'MyProtocol',
  createdAt: new Date(),
  updatedAt: new Date(),
  schemaVersion: '1',
  version: '2.0',
};

const Helpers = {
  jsonClient: httpClient,
  secureClient,
  makeUrl,
  httpsCert,
  httpsPrivateKey,
  makeWriteableStream,
  mockProtocol,
};

module.exports = Helpers;
