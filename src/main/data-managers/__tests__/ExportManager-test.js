/* eslint-env jest */

import ExportManager from '../ExportManager';
import { ErrorMessages } from '../../errors/RequestError';

jest.mock('nedb');
jest.mock('electron-log');

jest.mock('../SessionDB', () => (function MockSessionDB() {
  return {
    findAll: jest.fn().mockResolvedValue([]),
  };
}));

jest.mock('../ResolverManager');

jest.mock('../../utils/network-exporters/graphml/GraphMLFormatter', () => class {
  // Mock writer: close stream as soon as writing begins
  writeToStream = jest.fn((writeStream) => {
    writeStream.end();
    writeStream.destroy();
  })
});

jest.mock('../../utils/promised-fs', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../utils/archive', () => ({
  archive: jest.fn().mockResolvedValue({}),
}));

// jest.mock('../../utils/formatters/dir', () => ({
//   makeTempDir: jest.fn().mockResolvedValue('temp'),
//   removeTempDir: jest.fn(),
// }));

describe('ExportManager', () => {
  let protocol;
  let validOpts;
  let manager;

  beforeEach(() => {
    manager = new ExportManager('.');
    manager.resolverManager.getNetwork = jest.fn()
      .mockResolvedValue([]);
    protocol = { id: '1', name: '1', createdAt: new Date() };
    validOpts = {
      destinationFilepath: '.',
      exportFormats: ['graphml'],
      exportNetworkUnion: false,
      useDirectedEdges: false,
    };
  });

  it('rejects when no data will be exported', async () => {
    await expect(manager.createExportFile(protocol, validOpts))
      .rejects.toMatchErrorMessage(ErrorMessages.NothingToExport);
  });

  it('rejects if protocol missing', async () => {
    await expect(manager.createExportFile(null, validOpts))
      .rejects.toMatchErrorMessage(ErrorMessages.NotFound);
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

  // TODO: make the stream interface more testable
  describe('with data', () => {
    beforeEach(() => {
      manager = new ExportManager('.');
      protocol.codebook = {};
      manager.protocolManager.getProtocolSessions =
        jest.fn().mockResolvedValue([{ data: { nodes: [], edges: [] } }]);
    });

    it('returns a promise', async () => {
      await expect(manager.createExportFile(protocol, validOpts)).resolves.toAlwaysPass();
    });

    it('can abort the export', () => {
      const abortable = manager.createExportFile(protocol, validOpts);
      expect(abortable.abort).toBeInstanceOf(Function);
      abortable.abort();
    });
  });
});
