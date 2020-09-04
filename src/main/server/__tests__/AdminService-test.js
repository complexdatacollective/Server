/* eslint-env jest */
const net = require('net');

const { AdminService } = require('../AdminService');
const { jsonClient, makeUrl } = require('../../../../config/jest/setupTestEnv');
const DeviceManager = require('../../data-managers/DeviceManager');
const ProtocolManager = require('../../data-managers/ProtocolManager');

jest.mock('nedb');
jest.mock('electron-log');
jest.mock('../../data-managers/DeviceManager');
jest.mock('../../data-managers/ProtocolManager');
jest.mock('../devices/PairingRequestService');
jest.mock('../../data-managers/ExportManager', () => class {
  createExportFile = jest.fn().mockResolvedValue({ abort: jest.fn() })
});

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

        it('reports health status', async () => {
          adminService.statusDelegate = { status: () => undefined };
          await expect(jsonClient.get(endpoint)).rejects.toMatchObject({ statusCode: 503 });
        });
      });

      describe('pairing_requests/:id', () => {
        const endpoint = makeUrl('/pairing_requests/1', apiBase);

        it('returns 200 if exists', async () => {
          adminService.pairingRequestService.checkRequest.mockResolvedValue({
            createdAt: new Date(),
          });
          const resp = await jsonClient.head(endpoint);
          expect(resp.statusCode).toBe(200);
        });

        it('returns 404 if expired', async () => {
          adminService.pairingRequestService.checkRequest.mockResolvedValue(null);
          await expect(jsonClient.head(endpoint)).rejects.toMatchObject({ statusCode: 404 });
        });

        it('returns 500 if expired', async () => {
          adminService.pairingRequestService.checkRequest.mockRejectedValue(new Error());
          await expect(jsonClient.head(endpoint)).rejects.toMatchObject({ statusCode: 500 });
        });
      });

      describe('/devices', () => {
        const endpoint = makeUrl('/devices', apiBase);
        const mockDevices = [{ _id: 1 }];

        beforeAll(() => {
          DeviceManager.mockImplementation(() => ({
            destroy: () => Promise.resolve({}),
            fetchDeviceList: () => Promise.resolve(mockDevices),
          }));
        });

        it('returns a device list', async () => {
          const resp = await jsonClient.get(endpoint);
          expect(resp.json.devices).toEqual(mockDevices);
        });

        it('deletes a device', async () => {
          const res = await jsonClient.delete(`${endpoint}/1`);
          expect(res.json).toEqual({ status: 'ok' });
        });

        describe('when manager fails', () => {
          beforeAll(() => {
            DeviceManager.mockImplementation(() => ({
              destroy: () => Promise.reject({ error: 'mock' }),
              fetchDeviceList: () => Promise.reject({ error: 'mock' }),
            }));
          });

          it('sends an error for the device list', async () => {
            await expect(jsonClient.get(endpoint)).rejects.toMatchObject({ statusCode: 500 });
          });

          it('sends an error for device deletion', async () => {
            await expect(jsonClient.delete(`${endpoint}/1`)).rejects.toMatchObject({ statusCode: 500 });
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
            deleteProtocolSessions: jest.fn().mockResolvedValue({ status: 'ok' }),
            destroyProtocol: jest.fn().mockResolvedValue({ status: 'ok' }),
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
          expect(res.json.filenames).toEqual(mockFiles);
        });

        it('deletes a protocol', async () => {
          const res = await jsonClient.delete(`${endpoint}/${mockProtocol.id}`);
          expect(res.json.status).toBe('ok');
        });

        describe('when manager fails', () => {
          const mockResp = { statusCode: 500 };

          beforeAll(() => {
            const mockError = { error: 'mock' };
            ProtocolManager.mockImplementation(() => ({
              validateAndImport: jest.fn().mockRejectedValue(mockError),
              allProtocols: jest.fn().mockRejectedValue(mockError),
              deleteProtocolSessions: jest.fn().mockRejectedValue(mockError),
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

          it('sends an error for delete', async () => {
            await expect(jsonClient.delete(`${endpoint}/${mockProtocol.id}`)).rejects.toMatchObject(mockResp);
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
          const res = await jsonClient.get(`${sessEndpoint}/0/100/createdAt/-1/`);
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
            await expect(jsonClient.get(`${sessEndpoint}/0/100/createdAt/-1/`)).rejects.toMatchObject(mockResp);
          });

          it('returns a server error (delete all)', async () => {
            await expect(jsonClient.delete(sessEndpoint)).rejects.toMatchObject(mockResp);
          });

          it('returns a server error (delete)', async () => {
            await expect(jsonClient.delete(`${sessEndpoint}/1`)).rejects.toMatchObject(mockResp);
          });
        });
      });

      describe('reports', () => {
        const countsResult = { nodes: 0, edges: 0 };
        const bucketsResult = { one: 4, two: 0 };
        const timeSeriesResult = { entities: [], keys: [] };

        beforeAll(() => {
          ProtocolManager.mockImplementation(() => ({
            reportDb: {
              totalCounts: jest.fn().mockResolvedValue(countsResult),
              optionValueBuckets: jest.fn().mockResolvedValue(bucketsResult),
              entityTimeSeries: jest.fn().mockResolvedValue(timeSeriesResult),
            },
          }));
        });

        it('fetches count totals', async () => {
          const endpoint = makeUrl('protocols/1/reports/total_counts', apiBase);
          const res = await jsonClient.get(endpoint);
          expect(res.json.status).toBe('ok');
          expect(res.json.counts).toMatchObject(countsResult);
        });

        it('fetches bucketed categorical/ordinal data', async () => {
          const endpoint = makeUrl('protocols/1/reports/option_buckets', apiBase);
          const res = await jsonClient.post(endpoint, { nodeNames: '', edgeNames: '', egoNames: '' });
          expect(res.json.status).toBe('ok');
          expect(res.json.buckets).toMatchObject(bucketsResult);
        });

        it('fetches a time series', async () => {
          const endpoint = makeUrl('protocols/1/reports/entity_time_series', apiBase);
          const res = await jsonClient.get(endpoint);
          expect(res.json.status).toBe('ok');
          expect(res.json).toMatchObject(timeSeriesResult);
        });
      });

      describe('exports', () => {
        beforeEach(() => {
          adminService.protocolManager.getProtocol = jest.fn().mockResolvedValue({});
        });

        it('requires valid export options', async () => {
          const endpoint = makeUrl('protocols/1/export_requests', apiBase);
          const error = new Error('Mock Invalid Options');
          adminService.exportManager.createExportFile.mockRejectedValueOnce(error);
          await expect(jsonClient.post(endpoint, {})).rejects.toMatchObject({
            json: { message: error.message },
          });
        });

        it('reponds to a POST request', async () => {
          const endpoint = makeUrl('protocols/1/export_requests', apiBase);
          const res = await jsonClient.post(endpoint, { destinationFilepath: '/tmp', exportFormats: ['graphml'] });
          expect(res.json.status).toBe('ok');
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
