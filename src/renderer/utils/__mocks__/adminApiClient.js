/* eslint-env jest */

const mockReturningPromise = jest.fn().mockResolvedValue({});

const MockApiClient = jest.fn().mockImplementation(() => ({
  delete: mockReturningPromise,
  head: mockReturningPromise,
  get: mockReturningPromise,
  post: mockReturningPromise,
  requestServerStatus: mockReturningPromise,
}));

export default MockApiClient;
