/* eslint-env jest */
import AdminApiClient from '../adminApiClient';

describe('an AdminApiClient', () => {
  let client;

  beforeEach(() => {
    client = new AdminApiClient();
  });

  it('can get the server status', (done) => {
    const mockStatus = { uptime: 100 };

    fetch.mockResponse(JSON.stringify({ serverStatus: mockStatus }));

    client.get('/health')
      .then((data) => {
        expect(data).toHaveProperty('serverStatus');
        expect(data.serverStatus).toMatchObject(mockStatus);
      })
      .then(done);
  });

  it('rejects on server error', async () => {
    fetch.mockResponse(JSON.stringify({ status: 'error' }), { status: 503 });
    await expect(client.get('/health')).rejects.toMatchObject({ status: 'error' });
  });
});
