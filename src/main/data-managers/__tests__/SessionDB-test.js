/* eslint-env jest */
/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */

import SessionDB from '../SessionDB';
import { RequestError } from '../../errors/RequestError';

describe('SessionDB', () => {
  const mockProtocol = { name: 'a', _id: 'protocol1' };
  const mockSession = { uid: '1' };
  let sessions;
  beforeEach(() => {
    sessions = new SessionDB(null, true);
  });

  it('won’t persist without a session', () => {
    expect(sessions.insertAllForProtocol(mockSession, {}))
      .rejects.toMatchObject({ message: 'Missing protocol' });
  });

  it('persists a session', async () => {
    const result = await sessions.insertAllForProtocol(mockSession, mockProtocol);
    expect(result).toHaveLength(1);
  });

  it('persists a batch of sessions', async () => {
    const mockSessions = [{ uid: '1' }, { uid: '2' }];
    const result = await sessions.insertAllForProtocol(mockSessions, mockProtocol);
    expect(result).toHaveLength(2);
  });

  it('associates the protocol', async () => {
    const result = await sessions.insertAllForProtocol(mockSession, mockProtocol);
    expect(result[0]).toMatchObject({ protocolId: mockProtocol._id });
  });

  it('uses provided uid as the PK', async () => {
    const result = await sessions.insertAllForProtocol(mockSession, mockProtocol);
    expect(result[0]).toMatchObject({ _id: mockSession.uid });
  });

  it('finds all by protocol ID', async () => {
    await sessions.insertAllForProtocol([{ uid: '1' }, { uid: '2' }], mockProtocol);
    const found = await sessions.findAll(mockProtocol._id);
    expect(found).toHaveLength(2);
  });

  it('only finds for protocol ID', async () => {
    await sessions.insertAllForProtocol([{ uid: '1' }, { uid: '2' }], mockProtocol);
    const found = await sessions.findAll(null);
    expect(found).toHaveLength(0);
  });

  it('deletes all by protocol ID', async () => {
    await sessions.insertAllForProtocol([{ uid: '1' }, { uid: '2' }], mockProtocol);
    sessions.delete(mockProtocol._id);
    const found = await sessions.findAll(mockProtocol._id);
    expect(found).toHaveLength(0);
  });

  it('only deletes for protocol ID', async () => {
    await sessions.insertAllForProtocol([{ uid: '1' }, { uid: '2' }], mockProtocol);
    sessions.delete(null);
    const found = await sessions.findAll(mockProtocol._id);
    expect(found).toHaveLength(2);
  });

  it('deletes one by protocol & session IDs', async () => {
    await sessions.insertAllForProtocol([{ uid: '1' }, { uid: '2' }], mockProtocol);
    sessions.delete(mockProtocol._id, '1');
    const found = await sessions.findAll(mockProtocol._id);
    expect(found).toHaveLength(1);
  });

  it('Requires IDs on sessions', async () => {
    jest.spyOn(sessions.db, 'insert');
    const promise = sessions.insertAllForProtocol([{}], mockProtocol);
    await expect(promise).rejects.toBeInstanceOf(RequestError);
    expect(sessions.db.insert).not.toHaveBeenCalled();
  });

  it('Requires unique sessions IDs', async () => {
    const promise = sessions.insertAllForProtocol([{ uid: '1' }, { uid: '1' }], mockProtocol);
    await expect(promise).rejects.toBeInstanceOf(Error);
    await expect(promise).rejects.toMatchObject({ errorType: 'uniqueViolated' });
  });
});
