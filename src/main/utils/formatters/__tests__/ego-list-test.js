/* eslint-env jest */

import { makeWriteableStream } from '../../../../../config/jest/setupTestEnv';
import { asEgoList, toCSVStream, EgoListFormatter } from '../ego-list';

describe('asEgoList', () => {
  it('transforms a network to ego', () => {
    const network = { nodes: [], edges: [], ego: { id: 1, attributes: {} } };
    expect(asEgoList(network)).toEqual([network.ego]);
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
    expect(csv).toEqual('networkCanvasEgoID,networkCanvasCaseID,name\r\n1,,Jane\r\n');
  });

  it('escapes quotes', async () => {
    toCSVStream([{ _uid: 1, attributes: { nickname: '"Nicky"' } }], writable);
    const csv = await writable.asString();
    expect(csv).toEqual('networkCanvasEgoID,networkCanvasCaseID,nickname\r\n1,,"""Nicky"""\r\n');
  });

  it('escapes quotes in attr names', async () => {
    toCSVStream([{ _uid: 1, attributes: { '"quoted"': 1 } }], writable);
    const csv = await writable.asString();
    expect(csv).toEqual('networkCanvasEgoID,networkCanvasCaseID,"""quoted"""\r\n1,,1\r\n');
  });

  it('stringifies and quotes objects', async () => {
    toCSVStream([{ _uid: 1, attributes: { location: { x: 1, y: 1 } } }], writable);
    const csv = await writable.asString();
    expect(csv).toEqual('networkCanvasEgoID,networkCanvasCaseID,location\r\n1,,"{""x"":1,""y"":1}"\r\n');
  });

  it('exports undefined values as blank', async () => {
    toCSVStream([{ _uid: 1, attributes: { prop: undefined } }], writable);
    const csv = await writable.asString();
    expect(csv).toEqual('networkCanvasEgoID,networkCanvasCaseID,prop\r\n1,,\r\n');
  });

  it('exports null values as blank', async () => {
    toCSVStream([{ _uid: 1, attributes: { prop: null } }], writable);
    const csv = await writable.asString();
    expect(csv).toEqual('networkCanvasEgoID,networkCanvasCaseID,prop\r\n1,,\r\n');
  });

  it('exports `false` values as "false"', async () => {
    toCSVStream([{ _uid: 1, attributes: { prop: false } }], writable);
    const csv = await writable.asString();
    expect(csv).toEqual('networkCanvasEgoID,networkCanvasCaseID,prop\r\n1,,false\r\n');
  });
});

describe('EgoListFormatter', () => {
  let writable;

  beforeEach(() => {
    writable = makeWriteableStream();
  });

  it('writeToStream returns an abort controller', () => {
    const formatter = new EgoListFormatter({});
    const controller = formatter.writeToStream(writable);
    expect(controller.abort).toBeInstanceOf(Function);
  });
});
