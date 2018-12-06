/* eslint-env jest */

import { makeWriteableStream } from '../../../../../config/jest/setupTestEnv';
import { asAttributeList, toCSVStream } from '../attribute-list';

describe('asAttributeList', () => {
  it('transforms a network to nodes', () => {
    const network = { nodes: [{ id: 1 }], edges: [] };
    expect(asAttributeList(network)).toEqual(network.nodes);
  });
});

describe('toCSVStream', () => {
  let writable;

  beforeEach(() => {
    writable = makeWriteableStream();
  });

  it('writes a simple CSV', async () => {
    toCSVStream([{ _uid: 1, attributes: { name: 'Jane' } }], writable);
    const csv = await writable.asString();
    expect(csv).toEqual('_uid,name\r\n1,Jane\r\n');
  });

  it('escapes quotes', async () => {
    toCSVStream([{ _uid: 1, attributes: { nickname: '"Nicky"' } }], writable);
    const csv = await writable.asString();
    expect(csv).toEqual('_uid,nickname\r\n1,"""Nicky"""\r\n');
  });

  it('escapes quotes in attr names', async () => {
    toCSVStream([{ _uid: 1, attributes: { '"quoted"': 1 } }], writable);
    const csv = await writable.asString();
    expect(csv).toEqual('_uid,"""quoted"""\r\n1,1\r\n');
  });

  it('stringifies and quotes objects', async () => {
    toCSVStream([{ _uid: 1, attributes: { location: { x: 1, y: 1 } } }], writable);
    const csv = await writable.asString();
    expect(csv).toEqual('_uid,location\r\n1,"{""x"":1,""y"":1}"\r\n');
  });

  it('exports undefined values as blank', async () => {
    toCSVStream([{ _uid: 1, attributes: { prop: undefined } }], writable);
    const csv = await writable.asString();
    expect(csv).toEqual('_uid,prop\r\n1,\r\n');
  });

  it('exports null values as blank', async () => {
    toCSVStream([{ _uid: 1, attributes: { prop: null } }], writable);
    const csv = await writable.asString();
    expect(csv).toEqual('_uid,prop\r\n1,\r\n');
  });

  it('exports `false` values as "false"', async () => {
    toCSVStream([{ _uid: 1, attributes: { prop: false } }], writable);
    const csv = await writable.asString();
    expect(csv).toEqual('_uid,prop\r\n1,false\r\n');
  });
});
