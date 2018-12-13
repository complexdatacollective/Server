/* eslint-env jest */
import { DOMParser } from 'xmldom';

import createGraphML from '../createGraphML';

describe('createGraphML', () => {
  const buildXML = (...args) => (new DOMParser()).parseFromString(createGraphML(...args));
  const edgeType = 'peer';
  let network;
  let variableRegistry;
  let xml;

  beforeEach(() => {
    network = {
      nodes: [
        { _uid: '1', type: 'person', attributes: { 'mock-uuid-1': 'Dee', 'mock-uuid-2': 40 } },
        { _uid: '2', type: 'person', attributes: { 'mock-uuid-1': 'Carl', 'mock-uuid-2': 50 } },
      ],
      edges: [
        { from: '1', to: '2', type: 'mock-uuid-3' },
      ],
    };
    variableRegistry = {
      node: {
        person: {
          variables: {
            'mock-uuid-1': { name: 'firstName', type: 'string' },
            'mock-uuid-2': { name: 'age', type: 'number' },
          },
        },
      },
      edge: {
        'mock-uuid-3': {
          name: edgeType,
        },
      },
    };
    xml = buildXML(network, variableRegistry);
  });

  it('produces a graphml document', () => {
    expect(xml.getElementsByTagName('graphml')).toHaveLength(1);
  });

  it('defaults to undirected edges', () => {
    expect(xml.getElementsByTagName('graph')[0].getAttribute('edgedefault')).toEqual('undirected');
  });

  it('adds nodes', () => {
    expect(xml.getElementsByTagName('node')).toHaveLength(2);
  });

  it('adds edges', () => {
    expect(xml.getElementsByTagName('edge')).toHaveLength(1);
  });

  it('infers integer types', () => { // This indicates that transposition worked for nodes
    expect(xml.getElementById('age').getAttribute('attr.type')).toEqual('integer');
  });

  it('exports edge labels', () => { // This indicates that [non-]transposition worked for edges
    const edge = xml.getElementsByTagName('edge')[0];
    expect(edge.getElementsByTagName('data')[0].textContent).toEqual(edgeType);
  });

  describe('with directed edge option', () => {
    beforeEach(() => {
      xml = buildXML(network, variableRegistry, null, true);
    });

    it('specifies directed edges', () => {
      expect(xml.getElementsByTagName('graph')[0].getAttribute('edgedefault')).toEqual('directed');
    });
  });
});
