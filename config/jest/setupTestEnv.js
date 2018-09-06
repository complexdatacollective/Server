const http = require('http');
const https = require('https');
const enzyme = require('enzyme');
const Adapter = require('enzyme-adapter-react-16');
const url = require('url');

enzyme.configure({ adapter: new Adapter() });

const httpsCert = `-----BEGIN CERTIFICATE-----
MIIDBjCCAe6gAwIBAgIJb4Mq75vZ4WcqMA0GCSqGSIb3DQEBCwUAMCUxIzAhBgNV
BAMTGk5ldHdvcmsgQ2FudmFzIChsb2NhbGhvc3QpMB4XDTE4MDgwNjE1NTQzMFoX
DTI4MDgwMzE1NTQzMFowJTEjMCEGA1UEAxMaTmV0d29yayBDYW52YXMgKGxvY2Fs
aG9zdCkwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCCLNWb6Fpu+Ggs
5sixcLB5c5nIBSj/OBjaSTps8h5JNOll2AZWQ1WDWNDIRwej8/uh6K20WWO3nvK2
9w/EodnH09+tBWHkFy/pGBAZCtJi6hzG9ED9FlcBMetfa8azh39fdvqDneKxc6fc
ppanYqThb6WVxm0Ghk5rnFKjEaVBpkGaxcbfFXJGZqmb5pSPH7eSv0A4wqBN92nY
K3Qvr2sbf1iB7OKwTcsN0H0NSPn2NDG6TIGgu3meEf+gfbWwKFuuP6FZQIDM4I4N
6r9ZIyoOvbgTutmOgFU9lXET8biH3W/1mZ9TJZgQT6NRCNLMWGOGIPlswpmv0xRg
X+/TV/yzAgMBAAGjOTA3MAwGA1UdEwQFMAMBAf8wCwYDVR0PBAQDAgL0MBoGA1Ud
EQQTMBGCCWxvY2FsaG9zdIcEfwAAATANBgkqhkiG9w0BAQsFAAOCAQEAJqI9TKX5
4SGjCmpLtttPeVYDjkXwx24v/JmaXoT6cl7Q65AYsVdRQbw8rl36qNkLbRi0Uc5C
suTPxrhXBfKQ6GgxaINaPnk7jBKjM84BOjFD1jPMh9pio7rfE7VCvvy7ODZwqWFV
KwtjoL1ya83a25CeZScTZbvOnJ+O3Pisbiy2mscv9zcgppRYJJf+oJnt1PbhN/P+
9DrG/wIxSUYQy7vmdN61mfVylvahL2hZqPkwVzJwS+n4i+pPRoNP57ErcvnimvCm
B2cJveDofiZPxFlJfSQGG/LCQAH/NVreP7y6s6kayQXy9zVO7S0fHxnkiIO5o+zh
40wpQ+77K/jLdw==
-----END CERTIFICATE-----
`;

const httpsPrivateKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEogIBAAKCAQEAgizVm+habvhoLObIsXCweXOZyAUo/zgY2kk6bPIeSTTpZdgG
VkNVg1jQyEcHo/P7oeittFljt57ytvcPxKHZx9PfrQVh5Bcv6RgQGQrSYuocxvRA
/RZXATHrX2vGs4d/X3b6g53isXOn3KaWp2Kk4W+llcZtBoZOa5xSoxGlQaZBmsXG
3xVyRmapm+aUjx+3kr9AOMKgTfdp2Ct0L69rG39YgezisE3LDdB9DUj59jQxukyB
oLt5nhH/oH21sChbrj+hWUCAzOCODeq/WSMqDr24E7rZjoBVPZVxE/G4h91v9Zmf
UyWYEE+jUQjSzFhjhiD5bMKZr9MUYF/v01f8swIDAQABAoIBAApe0gGiqBmxFnOF
SzW/mX+DcxvZNWPnryssrEfjngANBA8F/7M9mAFnwPJDnls0Y7aJV9VHTcdiFUn4
MrxifHwL6ATbqenG4x05uoaUMyCIMBS1frvq3LGOrYajimfhAoezbc+wc0/Zu+S7
LMNW+3WuNE3TSfo8FuFByd+N11F8dSGn7yxBLWNdG/37jvQDPEbwEf03mA25iv04
r2YuI03ZfOXTiPwdF9tNeP2r81PQNyJ+pUODunANdTkL7gXV2vCRGP935+TkSOA+
LsLl5it/idIsMPxvnmFR6A9hVj6Uzebk/Js5giYi9LhKdn0sfPWB2MadVEdoGKfM
5Ntdf5kCgYEAvHYs3Fd6nBxLFJLknUmI5gjPk89v0Vs0K/Wu+GF4UKj7V5ruh52c
s3h/NYdvjIKREzTf5gifdg0X5uA6ytSxnaW7w6ibL7yCDL2o7WkzH5ruI+hsBLFr
eF1M1xSr2EYgoc9xxliDb+ywvwit0iVRzHYzkI/HBU1jvX4nAP+ZC/UCgYEAsNNY
yiipBknCLZJSSOIkNvqlPs8iysPPHycZW6WKb2v0mFldoroigZ8oLPClQbnf35PN
NtLy+dHNqNVjFFm6qei9c6dJBO0Oi0pSPu7gJqBx6Ruqd0dBvJ2Vwq4nP7pB9Fw+
hnJRFluP2ICvZhHrE4HwJD5n2WL0tJcgVdUNZQcCgYA+JJGCTm4lj8bKD+3GV3sG
rx0TVjE+zV4UqLx7Nlif8DiAmJvSqAwFudPoaLJFmMARnzu89FbwbDzXalS4kQ3I
N+AEElKpmPUhEmDjd+7dmw6vVHJZ0c7oL4uo2C4Z8HXOJUMU7hbZDyjwtQHr61Zf
nxI9tssfWndrAnAGCkIDCQKBgCpT7UU3Rn7C2UCfbiMUPycKCNRoMSPoi4Qhj+ho
UCMr7Hkrq0Zw2CG/P5bCZEy/ed/DObSN+qvilSB9NCKC+DQECpXMzaXoOTsOp3F5
LR8R+TKb9MpovEuyTU808SBILdGY4z67zr1TXbOt2k7Mq0EYMav7ZFCdZ4ZzRsJF
JdexAoGACcRcS2CUvOogbI5g4yKgiKcMCgEWlk7oMha29S5EV6E0LbMIzqrjGpCz
3F2hMdWQnZDPnVRyYhiUQx0CpQYlCE2wjfyC8nKTDMhhb+eQU+LtrpbydBcJVaKY
jMjjjpQVZginU1bHHyL+eE5duqO5uiG7KPGdtZYWjPIOqzBZlZc=
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

const makeUrl = (pathInput, base) => (
  new URL(pathInput, base.replace('0.0.0.0', 'localhost'))
);

const httpClient = jsonClient();
const secureClient = jsonClient(true);

const mockProtocol = {
  id: '1',
  filename: 'a.netcanvas',
  name: 'MyProtocol',
  createdAt: new Date(),
  updatedAt: new Date(),
  networkCanvasVersion: '1',
  version: '2.0',
};

const Helpers = {
  jsonClient: httpClient,
  secureClient,
  makeUrl,
  httpsCert,
  httpsPrivateKey,
  mockProtocol,
};

module.exports = Helpers;
