/* eslint-env jest */

import { makeWriteableStream } from '../../../../../../config/jest/setupTestEnv';
import GraphMLFormatter from '../GraphMLFormatter';

describe('GraphMLFormatter writeToStream', () => {
  let network;
  let codebook;
  let writable;

  beforeEach(() => {
    writable = makeWriteableStream();
    network = { nodes: [], edges: [] };
    codebook = { node: {} };
  });

  it('returns an abort controller', () => {
    const formatter = new GraphMLFormatter(network, false, false, codebook);
    const controller = formatter.writeToStream(writable);
    expect(controller.abort).toBeInstanceOf(Function);
  });

  it('produces XML', async () => {
    const formatter = new GraphMLFormatter(network, false, false, codebook);
    formatter.writeToStream(writable);
    const xml = await writable.asString();
    expect(xml).toMatch('<graphml');
  });
});
