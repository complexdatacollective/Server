const path = require('path');
const selfsigned = require('selfsigned');
const logger = require('electron-log');
const { app } = require('electron');

const promisedFs = require('../utils/promised-fs');

const userDataDir = app.getPath('userData');
const certDir = path.join(userDataDir, 'nc_certificates');
const certPem = path.join(certDir, 'device-api-cert.pem');
const privatePem = path.join(certDir, 'device-api-key.pem');
const publicPem = path.join(certDir, 'device-api-pub.pem');
const fingerprintFile = path.join(certDir, 'device-api-fingerprint.txt');

/**
 * If needed, creates a keypair and x.509 certificate and saves to disk.
 * If the files already exist, returns their contents.
 * @async
 * @return {Object} Resolves with `{ private, public, cert, fingerprint }`
 * @throws {Error} If files already exist
 */
const generatePemKeyPair = () => {
  const AltNameTypeDNS = 2;
  const AltNameTypeIP = 7;
  const attrs = [{ name: 'commonName', value: 'Network Canvas (localhost)' }];
  const extensions = [
    {
      name: 'basicConstraints',
      cA: true,
    },
    {
      name: 'keyUsage',
      keyCertSign: true,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true,
    },
    {
      name: 'subjectAltName',
      altNames: [
        {
          type: AltNameTypeDNS,
          value: 'localhost',
        },
        {
          type: AltNameTypeIP,
          ip: '127.0.0.1',
        },
      ],
    },
  ];

  // TODO: Ed25519 and/or native implementation
  const pems = selfsigned.generate(attrs, {
    algorithm: 'sha256',
    days: 365 * 10,
    keySize: 2048,
    extensions,
  });

  // Throw if attempting to overwrite an existing file
  const writeOpts = { encoding: 'utf-8', flag: 'wx' };
  return promisedFs.mkdir(certDir)
    .catch((err) => {
      if (err.code !== 'EEXIST') {
        logger.error(err);
        throw err;
      }
    })
    .then(() => Promise.all([
      promisedFs.writeFile(certPem, pems.cert, writeOpts),
      promisedFs.writeFile(privatePem, pems.private, writeOpts),
      promisedFs.writeFile(publicPem, pems.public, writeOpts),
      promisedFs.writeFile(fingerprintFile, pems.fingerprint, writeOpts),
    ]))
    .then(() => pems);
};

const ensurePemKeyPair = () => (
  Promise.all([
    promisedFs.readFile(certPem, 'utf-8'),
    promisedFs.readFile(privatePem, 'utf-8'),
    promisedFs.readFile(publicPem, 'utf-8'),
    promisedFs.readFile(fingerprintFile, 'utf-8'),
  ])
    .then(([cert, privateKey, publicKey, fingerprint]) => ({
      private: privateKey,
      public: publicKey,
      cert,
      fingerprint,
    }))
    .catch((err) => {
      if (err.code === 'ENOENT') {
        logger.info('Keys not found; creating');
        return generatePemKeyPair();
      }
      logger.error(err);
      throw err;
    })
);

module.exports = ensurePemKeyPair;
