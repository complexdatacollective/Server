/* eslint-env jest */
jest.mock('electron-log');

const { AdminService } = require('../adminService');
const { jsonClient } = require('../../../setupTests');

const testPortNumber = 52001;

describe('the AdminService', () => {
  let adminService;
  const mockStatusDelegate = {
    status: () => {},
  };

  beforeEach(() => {
    adminService = new AdminService({ statusDelegate: mockStatusDelegate });
  });

  afterEach(() => {
    adminService.stop();
  });

  it('defines an API', () => {
    expect(adminService.api).toBeDefined();
  });

  describe('API', () => {
    it('listens on a port', async () => {
      await expect(
        adminService.start(testPortNumber),
      ).resolves.toBe(adminService);
    });

    it('reports health status', (done) => {
      const mockStatus = { uptime: 100 };
      adminService.start(testPortNumber)
        .then(() => {
          adminService.statusDelegate = { status: () => mockStatus };
          jsonClient.get(new URL('/health', `http://localhost:${testPortNumber}`))
            .then((res) => {
              expect(res.json).toMatchObject({
                serverStatus: expect.any(Object),
              });
            })
            .then(done);
        });
    });
  });
});
