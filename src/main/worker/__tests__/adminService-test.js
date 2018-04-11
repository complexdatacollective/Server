/* eslint-env jest */
const net = require('net');

const { AdminService } = require('../adminService');
const { jsonClient, makeUrl } = require('../../../setupTests');
const DeviceManager = require('../../data-managers/DeviceManager');
const ProtocolManager = require('../../data-managers/ProtocolManager');

jest.mock('electron-log');
jest.mock('../../data-managers/DeviceManager');
jest.mock('../../data-managers/ProtocolManager');

const testPortNumber = 52001;

describe('the AdminService', () => {
  let adminService;
  const mockStatusDelegate = {
    status: () => {},
  };

  beforeEach(() => {
    adminService = new AdminService({
      statusDelegate: mockStatusDelegate,
      dataDir: '',
    });
  });

  afterEach((done) => {
    adminService.stop().then(done);
  });

  it('defines an API', () => {
    expect(adminService.api).toBeDefined();
  });

  describe('API', () => {
    const apiBase = `http://localhost:${testPortNumber}`;

    it('listens on a port', async () => {
      await expect(
        adminService.start(testPortNumber),
      ).resolves.toBe(adminService);
    });

    it('defaults to a port if not supplied', async () => {
      await expect(
        adminService.start(),
      ).resolves.toBe(adminService);
    });

    describe('when another service running on requested port', () => {
      let otherService;

      beforeEach((done) => {
        otherService = new net.Server().listen(testPortNumber, 'localhost', done);
      });

      afterEach(() => {
        otherService.close();
      });

      it('discovers a new port if attempted port is in use', async () => {
        expect(testPortNumber).toBeLessThan(65535 - 1);
        const svc = await adminService.start(testPortNumber);
        expect(svc).toBe(adminService);
        expect(svc.port).toEqual(testPortNumber + 1);
      });
    });

    describe('running', () => {
      beforeEach(done => adminService.start(testPortNumber).then(done));

      describe('/health', () => {
        const endpoint = makeUrl('/health', apiBase);

        it('reports health status', async () => {
          const mockStatus = { uptime: 100 };
          adminService.statusDelegate = { status: () => mockStatus };
          const res = await jsonClient.get(endpoint);
          expect(res.json).toMatchObject({
            serverStatus: expect.any(Object),
          });
        });
      });

      describe('/devices', () => {
        const endpoint = makeUrl('/devices', apiBase);
        const mockDevices = [{ _id: 1 }];

        beforeAll(() => {
          DeviceManager.mockImplementation(() => ({
            fetchDeviceList: () => Promise.resolve(mockDevices),
          }));
        });

        it('returns a device list', async () => {
          const resp = await jsonClient.get(endpoint);
          expect(resp.json.devices).toEqual(mockDevices);
        });

        describe('when manager fails', () => {
          beforeAll(() => {
            DeviceManager.mockImplementation(() => ({
              fetchDeviceList: () => Promise.reject({ error: 'mock' }),
            }));
          });

          it('sends an error', async () => {
            await expect(jsonClient.get(endpoint)).rejects.toMatchObject({ statusCode: 500 });
          });
        });
      });

      describe('/protocols', () => {
        const endpoint = makeUrl('/protocols', apiBase);
        const mockFiles = ['a.netcanvas'];

        beforeAll(() => {
          ProtocolManager.mockImplementation(() => ({
            validateAndImport: files => Promise.resolve(files),
            allProtocols: () => Promise.resolve(mockFiles.map(f => ({ filename: f }))),
          }));
        });

        it('returns a list', async () => {
          const res = await jsonClient.get(endpoint);
          expect(res.json.protocols).toContainEqual({ filename: mockFiles[0] });
        });

        it('accepts posted filenames', async () => {
          const res = await jsonClient.post(endpoint, { files: mockFiles });
          expect(res.json.protocols).toEqual(mockFiles);
        });

        describe('when importer fails', () => {
          beforeAll(() => {
            const mockError = { error: 'mock' };
            ProtocolManager.mockImplementation(() => ({
              validateAndImport: () => Promise.reject(mockError),
              allProtocols: () => Promise.reject(mockError),
            }));
          });

          it('sends an error for get', async () => {
            await expect(jsonClient.get(endpoint)).rejects.toMatchObject({ statusCode: 500 });
          });

          it('sends an error for post', async () => {
            await expect(jsonClient.post(endpoint, {})).rejects.toMatchObject({ statusCode: 500 });
          });
        });
      });
    });
  });
});
