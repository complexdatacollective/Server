/* eslint-env jest */
import AdminApiClient from '../adminApiClient';

describe('an AdminApiClient', () => {
  let client;

  beforeEach(() => {
    client = new AdminApiClient();
  });

  afterEach(() => {
    fetch.resetMocks();
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

  it('can post data', async () => {
    const payload = { foo: 'bar' };
    fetch.mockResponse(JSON.stringify({ status: 'ok', data: payload }));
    await expect(client.post('/foo', payload)).resolves.toMatchObject({ status: 'ok' });
  });

  it('rejects on fetch error', async () => {
    const notFoundErr = new Error('Not Found');
    fetch.mockReject(notFoundErr);
    await expect(client.post('/foo')).rejects.toMatchObject(notFoundErr);
  });

  it('rejects on server error', async () => {
    fetch.mockResponse(JSON.stringify({ status: 'error' }), { status: 503 });
    await expect(client.get('/health')).rejects.toMatchObject({ status: 'error' });
  });
});
