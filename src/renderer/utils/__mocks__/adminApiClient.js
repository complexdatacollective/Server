/* eslint-env jest */

const mockReturningPromise = jest.fn(() => Promise.resolve({}));

const mockApiClient = jest.fn(() => (
  {
    get: mockReturningPromise,
    on: mockReturningPromise,
    requestServerStatus: mockReturningPromise,
  }
));

export default mockApiClient;
