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

  it('has no static port', () => {
    expect(new AdminApiClient().port).toBe(null);
  });

  it('checks for port before fetching', () => {
    expect(client.fetch()).rejects.toMatchErrorMessage('no port set');
  });

  it('sets port for all clients', () => {
    AdminApiClient.setPort(123);
    expect(new AdminApiClient().port).toBe(123);
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

  it('rejects string payloads', async () => {
    await expect(client.post('/foo', 'not-json')).rejects.toMatchObject({ message: expect.stringMatching(/JSON/) });
  });

  it('rejects invalid JSON', async () => {
    const obj = {};
    obj.circular = obj;
    await expect(client.post('/foo', obj)).rejects.toMatchObject({ message: expect.stringMatching(/JSON/) });
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
    fetch.mockResponse('{}');
    await client.delete('/foo');
    expect(fetch).toHaveBeenCalledWith(expect.any(String), { method: 'DELETE' });
  });
});
