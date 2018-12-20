/* eslint-env jest */

import ExportManager from '../ExportManager';
import { ErrorMessages } from '../../errors/RequestError';

jest.mock('../../utils/promised-fs', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../utils/archive', () => ({
  archive: jest.fn().mockResolvedValue({}),
}));

jest.mock('../../utils/formatters/dir', () => ({
  makeTempDir: jest.fn().mockResolvedValue('temp'),
  removeTempDir: jest.fn(),
}));

describe('ExportManager', () => {
  let protocol;
  let validOpts;
  let manager;

  beforeEach(() => {
    manager = new ExportManager('.');
    protocol = { id: '1', name: '1', createdAt: new Date() };
    validOpts = {
      destinationFilepath: '.',
      exportFormats: ['graphml'],
      exportNetworkUnion: false,
      useDirectedEdges: false,
    };
  });

  it('returns a promise', async () => {
    await expect(manager.createExportFile(protocol, validOpts)).resolves.toAlwaysPass();
  });

  it('rejects if protocol missing', async () => {
    await expect(manager.createExportFile(null, validOpts)).rejects.toMatchErrorMessage('Not found');
  });

  it('rejects if path missing', async () => {
    const opts = { ...validOpts, destinationFilepath: null };
    const message = ErrorMessages.InvalidExportOptions;
    await expect(manager.createExportFile(protocol, opts)).rejects.toMatchErrorMessage(message);
  });

  it('rejects if formats missing', async () => {
    const opts = { ...validOpts, exportFormats: null };
    const message = ErrorMessages.InvalidExportOptions;
    await expect(manager.createExportFile(protocol, opts)).rejects.toMatchErrorMessage(message);
  });

  it('rejects if type is invalid', async () => {
    const opts = { ...validOpts, exportFormats: ['not-a-format'] };
    const message = ErrorMessages.InvalidExportOptions;
    await expect(manager.createExportFile(protocol, opts)).rejects.toMatchErrorMessage(message);
  });

  fdescribe('with data', () => {
    beforeEach(() => {
      protocol.variableRegistry = {};
      manager.sessionDB = {
        findAll: jest.fn().mockResolvedValue([{ data: { nodes: [], edges: [] } }]),
      };
    });

    it('exports a graphml file', async () => {
      await expect(manager.createExportFile(protocol, validOpts)).resolves.toAlwaysPass();
    });
  });
});
