/* eslint-env jest */
import { DOMParser } from 'xmldom';

import { graphMLGenerator } from '../createGraphML';

describe('buildGraphML', () => {
  const buildXML = (...args) => {
    let xmlString = '';
    for (const chunk of graphMLGenerator(...args)) { // eslint-disable-line no-restricted-syntax
      xmlString += chunk;
    }
    return (new DOMParser()).parseFromString(xmlString);
  };
  const edgeType = 'peer';
  let network;
  let codebook;
  let xml;

  beforeEach(() => {
    network = {
      nodes: [
        { _uid: '1', type: 'person', attributes: { 'mock-uuid-1': 'Dee', 'mock-uuid-2': 40, 'mock-uuid-3': { x: 0, y: 0 } } },
        { _uid: '2', type: 'person', attributes: { 'mock-uuid-1': 'Carl', 'mock-uuid-2': 50, 'mock-uuid-3': { x: 0, y: 0 } } },
      ],
      edges: [
        { from: '1', to: '2', type: 'mock-uuid-3' },
      ],
    };
    codebook = {
      node: {
        person: {
          variables: {
            'mock-uuid-1': { name: 'firstName', type: 'string' },
            'mock-uuid-2': { name: 'age', type: 'number' },
            'mock-uuid-3': { name: 'layout', type: 'layout' },
          },
        },
      },
      edge: {
        'mock-uuid-3': {
          name: edgeType,
        },
      },
    };
    xml = buildXML(network, codebook);
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

  it('infers int types', () => { // This indicates that transposition worked for nodes
    expect(xml.getElementById('age').getAttribute('attr.type')).toEqual('int');
  });

  it('converts layout types', () => {
    expect(xml.getElementById('layoutX').getAttribute('attr.type')).toEqual('double');
    expect(xml.getElementById('layoutY').getAttribute('attr.type')).toEqual('double');
  });

  it('exports edge labels', () => { // This indicates that [non-]transposition worked for edges
    const edge = xml.getElementsByTagName('edge')[0];
    expect(edge.getElementsByTagName('data')[0].textContent).toEqual(edgeType);
  });

  describe('with directed edge option', () => {
    beforeEach(() => {
      xml = buildXML(network, codebook, true);
    });

    it('specifies directed edges', () => {
      expect(xml.getElementsByTagName('graph')[0].getAttribute('edgedefault')).toEqual('directed');
    });
  });
});
