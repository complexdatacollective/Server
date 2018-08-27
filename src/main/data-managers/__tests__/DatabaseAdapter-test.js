/* eslint-env jest */
const DatabaseAdapter = require('../DatabaseAdapter');

jest.mock('nedb', () => class nedb {
  insert = jest.fn().mockImplementation((data, cb) => { cb(null, null); })
});

describe('abstract DatabaseAdapter', () => {
  let adapter;

  beforeEach(() => {
    adapter = new DatabaseAdapter('test', { inMemoryOnly: true });
  });

  it('rejects with a custom error if insert returns no document', async () => {
    await expect(adapter.create({})).rejects.toMatchErrorMessage('Insert failed');
  });
});
