/* eslint-env jest */
const selfsigned = require('selfsigned');

const { ensurePemKeyPair } = require('../certificateManager');
const promisedFs = require('../../utils/promised-fs');

jest.mock('selfsigned');
jest.mock('electron-log');
jest.mock('../../utils/promised-fs');

describe('ensurePemKeyPair', () => {
  const mockPems = {
    cert: 'CERTIFICATE',
    fingerprint: '::',
    private: 'PRIVATE',
    public: 'PUBLIC',
  };

  beforeAll(() => {
    selfsigned.generate.mockReturnValue(mockPems);
    promisedFs.mkdir.mockResolvedValue(undefined);
    promisedFs.writeFile.mockResolvedValue('');
  });

  afterEach(() => {
    promisedFs.readFile.mockClear();
    promisedFs.writeFile.mockClear();
  });

  describe('when files do not exist', () => {
    beforeAll(() => {
      const noFileErr = new Error();
      noFileErr.code = 'ENOENT';
      promisedFs.readFile.mockRejectedValue(noFileErr);
    });

    it('writes pems to files', async () => {
      const pair = await ensurePemKeyPair();
      expect(promisedFs.writeFile).toHaveBeenCalledTimes(4);
      expect(pair).toEqual(mockPems);
    });

    it('uses existing directory', async () => {
      const alreadyExistsErr = new Error();
      alreadyExistsErr.code = 'EEXIST';
      promisedFs.mkdir.mockRejectedValue(alreadyExistsErr);
      const pair = await ensurePemKeyPair();
      expect(promisedFs.writeFile).toHaveBeenCalledTimes(4);
      expect(pair).toEqual(mockPems);
    });

    it('throws if dir cannot be created', async () => {
      const err = new Error('unknown fs error');
      promisedFs.mkdir.mockRejectedValue(err);
      await expect(ensurePemKeyPair()).rejects.toEqual(err);
    });
  });

  describe('when files exist', () => {
    beforeAll(() => {
      promisedFs.readFile.mockResolvedValue('');
    });

    it('writes pems to files', async () => {
      const pair = await ensurePemKeyPair();
      expect(promisedFs.readFile).toHaveBeenCalledTimes(4);
      Object.keys(mockPems).forEach(prop => expect(pair).toHaveProperty(prop));
    });

    it('throws if they cannot be read', async () => {
      const err = new Error('unknown fs error');
      promisedFs.readFile.mockRejectedValue(err);
      await expect(ensurePemKeyPair()).rejects.toEqual(err);
    });
  });
});
