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

describe('ExportManager', () => {
  let manager;

  beforeEach(() => {
    manager = new ExportManager('.');
  });

  it('rejects if protocol missing', async () => {
    await expect(manager.exportSessions(null, null))
      .rejects.toMatchErrorMessage(ErrorMessages.NotFound);
  });
});
