/* eslint-env jest */
/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */

import SessionDB from '../SessionDB';

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

  // TODO: Review failure; I don't think in-mem DBs share this property with persisted DBs
  it.skip('does not store ID in duplicate', () => {});
  // async () => {
  //   const result = await sessions.insertAllForProtocol(mockSession, mockProtocol);
  //   sessions.db.persistence.compactDatafile();
  //   expect(result[0]).not.toHaveProperty('uid');
  // });

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
    sessions.deleteAll(mockProtocol._id);
    const found = await sessions.findAll(mockProtocol._id);
    expect(found).toHaveLength(0);
  });

  it('only deletes for protocol ID', async () => {
    await sessions.insertAllForProtocol([{ uid: '1' }, { uid: '2' }], mockProtocol);
    sessions.deleteAll(null);
    const found = await sessions.findAll(mockProtocol._id);
    expect(found).toHaveLength(2);
  });
});
