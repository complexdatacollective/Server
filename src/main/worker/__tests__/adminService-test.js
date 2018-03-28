/* eslint-env jest */
const { AdminService } = require('../adminService');
const { jsonClient, makeUrl } = require('../../../setupTests');
const DeviceManager = require('../deviceManager');
const ProtocolImporter = require('../../utils/ProtocolImporter');

jest.mock('electron-log');
jest.mock('../deviceManager');
jest.mock('../../utils/ProtocolImporter');

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

    it('requires a port', async () => {
      await expect(adminService.start()).rejects.toMatchObject({ message: 'Missing port' });
    });

    it('listens on a port', async () => {
      await expect(
        adminService.start(testPortNumber),
      ).resolves.toBe(adminService);
    });

    describe('running', () => {
      beforeEach(done => adminService.start(testPortNumber).then(done));

      describe('/health', () => {
        const endpoint = makeUrl('/health', apiBase);

        it('reports health status', (done) => {
          const mockStatus = { uptime: 100 };
          adminService.statusDelegate = { status: () => mockStatus };
          jsonClient.get(endpoint)
            .then((res) => {
              expect(res.json).toMatchObject({
                serverStatus: expect.any(Object),
              });
            })
            .then(done);
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

        it('returns a device list', (done) => {
          jsonClient.get(endpoint)
            .then(resp => expect(resp.json.devices).toEqual(mockDevices))
            .then(done);
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
          ProtocolImporter.mockImplementation(() => ({
            validateAndImport: files => Promise.resolve(files),
            savedFiles: () => Promise.resolve(mockFiles),
          }));
        });

        it('returns a list', (done) => {
          jsonClient.get(endpoint)
            .then(res => expect(res.json.protocols).toEqual(mockFiles))
            .then(done);
        });

        it('accepts posted filenames', (done) => {
          jsonClient.post(endpoint, { files: mockFiles })
            .then(res => expect(res.json.protocols).toEqual(mockFiles))
            .then(done);
        });

        describe('when importer fails', () => {
          beforeAll(() => {
            const mockError = { error: 'mock' };
            ProtocolImporter.mockImplementation(() => ({
              validateAndImport: () => Promise.reject(mockError),
              savedFiles: () => Promise.reject(mockError),
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
