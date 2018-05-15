/* eslint-env jest */

const mockReturningPromise = jest.fn().mockResolvedValue({});

const MockApiClient = jest.fn().mockImplementation(() => ({
  get: mockReturningPromise,
  post: mockReturningPromise,
  requestServerStatus: mockReturningPromise,
}));

export default MockApiClient;
