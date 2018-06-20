/* eslint-env jest */
const net = require('net');

const { AdminService } = require('../AdminService');
const { jsonClient, makeUrl } = require('../../../../config/jest/setupTestEnv');
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
    adminService.stop().then(() => done());
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
        otherService = new net.Server().listen(testPortNumber, 'localhost', () => done());
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
      beforeEach(done => adminService.start(testPortNumber).then(() => done()));

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
        const mockProtocol = { id: '1' };

        beforeAll(() => {
          ProtocolManager.mockImplementation(() => ({
            validateAndImport: files => Promise.resolve(files),
            allProtocols: jest.fn().mockResolvedValue(mockFiles.map(f => ({ filename: f }))),
            getProtocol: jest.fn().mockResolvedValue(mockProtocol),
          }));
        });

        it('returns a list', async () => {
          const res = await jsonClient.get(endpoint);
          expect(res.json.protocols).toContainEqual({ filename: mockFiles[0] });
        });

        it('returns a protocol', async () => {
          const res = await jsonClient.get(`${endpoint}/${mockProtocol.id}`);
          expect(res.json.protocol).toEqual(mockProtocol);
        });

        it('accepts posted filenames', async () => {
          const res = await jsonClient.post(endpoint, { files: mockFiles });
          expect(res.json.protocols).toEqual(mockFiles);
        });

        describe('when manager fails', () => {
          const mockResp = { statusCode: 500 };

          beforeAll(() => {
            const mockError = { error: 'mock' };
            ProtocolManager.mockImplementation(() => ({
              validateAndImport: jest.fn().mockRejectedValue(mockError),
              allProtocols: jest.fn().mockRejectedValue(mockError),
              getProtocol: jest.fn().mockRejectedValue(mockError),
            }));
          });

          it('sends an error for list', async () => {
            await expect(jsonClient.get(endpoint)).rejects.toMatchObject(mockResp);
          });

          it('sends an error for post', async () => {
            await expect(jsonClient.post(endpoint, {})).rejects.toMatchObject(mockResp);
          });

          it('sends an error for get', async () => {
            await expect(jsonClient.get(`${endpoint}/${mockProtocol.id}`)).rejects.toMatchObject(mockResp);
          });
        });
      });

      describe('/sessions', () => {
        const mockSessions = [{ id: '1' }, { id: '2' }];
        const sessEndpoint = makeUrl('/protocols/1/sessions', apiBase);

        beforeAll(() => {
          ProtocolManager.mockImplementation(() => ({
            getProtocolSessions: jest.fn().mockResolvedValue(mockSessions),
            deleteProtocolSessions: jest.fn().mockResolvedValue(1),
          }));
        });

        it('loads sessions', async () => {
          const res = await jsonClient.get(sessEndpoint);
          expect(res.json.sessions).toEqual(mockSessions);
        });

        it('deletes sessions', async () => {
          const res = await jsonClient.delete(sessEndpoint);
          expect(res.json).toEqual({ status: 'ok' });
        });

        it('deletes one session', async () => {
          const res = await jsonClient.delete(`${sessEndpoint}/1`);
          expect(res.json).toEqual({ status: 'ok' });
        });

        describe('when manager fails', () => {
          const mockResp = { statusCode: 500 };
          beforeAll(() => {
            const mockError = new Error('mock error');
            ProtocolManager.mockImplementation(() => ({
              getProtocolSessions: jest.fn().mockRejectedValue(mockError),
              deleteProtocolSessions: jest.fn().mockRejectedValue(mockError),
            }));
          });

          it('returns a server error (get)', async () => {
            await expect(jsonClient.get(sessEndpoint)).rejects.toMatchObject(mockResp);
          });

          it('returns a server error (delete)', async () => {
            await expect(jsonClient.delete(sessEndpoint)).rejects.toMatchObject(mockResp);
          });
        });
      });
    });
  });

  it('resets devices, protocols, and sessions', async () => {
    adminService.deviceManager.destroyAllDevices = jest.fn();
    adminService.protocolManager.destroyAllProtocols = jest.fn();
    adminService.protocolManager.destroyAllSessions = jest.fn();
    await adminService.resetData();
    expect(adminService.deviceManager.destroyAllDevices).toHaveBeenCalled();
    expect(adminService.protocolManager.destroyAllProtocols).toHaveBeenCalled();
    expect(adminService.protocolManager.destroyAllSessions).toHaveBeenCalled();
  });
});
