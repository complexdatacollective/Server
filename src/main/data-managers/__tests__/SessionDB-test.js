/* eslint-env jest */
/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */

import SessionDB from '../SessionDB';
import { ErrorMessages, RequestError } from '../../errors/RequestError';

describe('SessionDB', () => {
  const mockProtocol = { name: 'a', _id: 'protocol1' };
  const mockSession = { uuid: '1', data: {} };
  const mockSessions = [{ uuid: '1', data: {} }, { uuid: '2', data: {} }];
  let sessions;
  beforeEach(() => {
    sessions = new SessionDB(null, { inMemoryOnly: true });
  });

  it('won’t persist without a session', async () => {
    await expect(sessions.insertAllForProtocol(mockSession, {}))
      .rejects.toMatchErrorMessage(ErrorMessages.NotFound);
  });

  it('persists a session', async () => {
    const result = await sessions.insertAllForProtocol(mockSession, mockProtocol);
    expect(result).toHaveLength(1);
  });

  it('persists a batch of sessions', async () => {
    const result = await sessions.insertAllForProtocol(mockSessions, mockProtocol);
    expect(result).toHaveLength(2);
  });

  it('associates the protocol', async () => {
    const result = await sessions.insertAllForProtocol(mockSession, mockProtocol);
    expect(result[0]).toMatchObject({ protocolId: mockProtocol._id });
  });

  it('uses provided uuid as the PK', async () => {
    const result = await sessions.insertAllForProtocol(mockSession, mockProtocol);
    expect(result[0]).toMatchObject({ _id: mockSession.uuid });
  });

  it('finds all by protocol ID', async () => {
    await sessions.insertAllForProtocol(mockSessions, mockProtocol);
    const found = await sessions.findAll(mockProtocol._id);
    expect(found).toHaveLength(2);
  });

  it('only finds for protocol ID', async () => {
    await sessions.insertAllForProtocol(mockSessions, mockProtocol);
    const found = await sessions.findAll(null);
    expect(found).toHaveLength(0);
  });

  it('deletes all by protocol ID', async () => {
    await sessions.insertAllForProtocol(mockSessions, mockProtocol);
    sessions.delete(mockProtocol._id);
    const found = await sessions.findAll(mockProtocol._id);
    expect(found).toHaveLength(0);
  });

  it('only deletes for protocol ID', async () => {
    await sessions.insertAllForProtocol(mockSessions, mockProtocol);
    expect(sessions.delete(null)).rejects.toMatchErrorMessage('Invalid protocol ID');
    const found = await sessions.findAll(mockProtocol._id);
    expect(found).toHaveLength(2);
  });

  it('deletes one by protocol & session IDs', async () => {
    await sessions.insertAllForProtocol(mockSessions, mockProtocol);
    sessions.delete(mockProtocol._id, '1');
    const found = await sessions.findAll(mockProtocol._id);
    expect(found).toHaveLength(1);
  });

  it('deletes all', async () => {
    await sessions.insertAllForProtocol(mockSessions[0], mockProtocol);
    await sessions.insertAllForProtocol(mockSessions[1], { name: 'p2', _id: 'p2' });
    sessions.deleteAll();
    const found = await sessions.findAll(mockProtocol._id);
    expect(found).toHaveLength(0);
  });

  it('requires IDs on sessions', async () => {
    jest.spyOn(sessions.db, 'insert');
    const promise = sessions.insertAllForProtocol([{}], mockProtocol);
    await expect(promise).rejects.toBeInstanceOf(RequestError);
    expect(sessions.db.insert).not.toHaveBeenCalled();
  });

  it('requires unique session IDs', async () => {
    const promise = sessions.insertAllForProtocol([mockSession, mockSession], mockProtocol);
    await expect(promise).rejects.toBeInstanceOf(Error);
    await expect(promise).rejects.toMatchObject({ errorType: 'uniqueViolated' });
  });

  describe('with mocked DB cursor', () => {
    const mockCursor = {
      exec: (...args) => args[args.length - 1](null),
    };
    mockCursor.limit = jest.fn().mockReturnValue(mockCursor);
    mockCursor.skip = jest.fn().mockReturnValue(mockCursor);
    mockCursor.sort = jest.fn().mockReturnValue(mockCursor);

    beforeEach(() => {
      sessions.db.find = jest.fn(() => (mockCursor));
    });

    it('accepts a limit on the query', async () => {
      await sessions.findAll(mockProtocol._id, 123);
      expect(mockCursor.limit).toHaveBeenCalledWith(123);
    });

    describe('when underlying db fails', () => {
      const mockError = new Error('database error');
      beforeEach(() => {
        mockCursor.exec = (...args) => args[args.length - 1](mockError);
      });

      it('rejects a query', async () => {
        await expect(sessions.findAll(mockProtocol._id)).rejects.toThrow(mockError);
      });
    });
  });
});
