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

    client.on('SERVER_STATUS', (data) => {
      expect(data).toEqual(expect.objectContaining(mockStatus));
      done();
    });

    client.requestServerStatus();
  });

  it('ignores server status on error', (done) => {
    let eventsEmitted = 0;
    fetch.mockResponse(JSON.stringify({ status: 'error' }), { status: 503 });

    client.on('SERVER_STATUS', () => { eventsEmitted += 1; });

    client.requestServerStatus()
      .then(() => expect(eventsEmitted).toBe(0))
      .then(done);
  });
});
