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

  it('can get the server status', async () => {
    const mockStatus = { uptime: 100 };
    fetch.mockResponse(JSON.stringify({ serverStatus: mockStatus }));
    const data = await client.get('/health');
    expect(data).toHaveProperty('serverStatus');
    expect(data.serverStatus).toMatchObject(mockStatus);
  });

  it('can post data', async () => {
    const payload = { foo: 'bar' };
    fetch.mockResponse(JSON.stringify({ status: 'ok', data: payload }));
    await expect(client.post('/foo', payload)).resolves.toMatchObject({ status: 'ok' });
  });

  it('rejects string payloads', () => {
    expect(client.post('/foo', 'not-json')).rejects.toMatchObject({ message: expect.stringMatching(/JSON/) });
  });

  it('rejects invalid JSON', () => {
    const obj = {};
    obj.circular = obj;
    expect(client.post('/foo', obj)).rejects.toMatchObject({ message: expect.stringMatching(/JSON/) });
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

  it('can make a delete request', async () => {
    await client.delete('/foo');
    expect(fetch).toHaveBeenCalledWith(expect.any(String), { method: 'DELETE' });
  });
});
