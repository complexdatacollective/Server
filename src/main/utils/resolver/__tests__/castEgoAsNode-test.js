/* eslint-env jest */
const { Factory } = require('../../../../__factories__/Factory');
const castEgoAsNode = require('../castEgoAsNode');

describe('castEgoAsNode', () => {
  it('does not error when the network contains no ego', () => {
    const { ego, ...network } = Factory.network.build();
    const egoCaster = castEgoAsNode({}, 'person');

    expect(egoCaster(network)).toEqual(network);
  });

  it('converts ego to a node of the specified type', () => {
    const network = Factory.network.build();
    const egoCaster = castEgoAsNode({
      ego: { variables: { name: { name: 'name', type: 'string' }, phrase: { name: 'phrase', type: 'string' } } },
      node: {
        person: { variables: {
          personName: { name: 'name', type: 'string' },
          personPhrase: { name: 'phrase', type: 'string' },
        } },
      },
    }, 'person');

    const expectedNetwork = {
      nodes: [
        ...network.nodes,
        {
          ...network.ego,
          attributes: {
            personName: network.ego.attributes.name,
            personPhrase: network.ego.attributes.phrase,
          },
        },
      ],
      edges: network.edges,
      sessionVariables: network.sessionVariables,
    };

    expect(egoCaster(network)).toEqual(expectedNetwork);
  });

  it('if variable type not found use original ego variable id', () => {
    const networkTemplate = Factory.network.build();

    const egoCaster = castEgoAsNode({
      ego: { variables: {
        name: { name: 'name', type: 'string' },
        phrase: { name: 'phrase', type: 'string' },
        newProperty: { name: 'newProperty', type: 'string' },
      } },
      node: {
        person: { variables: {
          name: { name: 'name', type: 'string' },
          phrase: { name: 'phrase', type: 'string' },
        } },
      },
    }, 'person');

    const network = {
      ...networkTemplate,
      ego: {
        _uid: networkTemplate.ego._uid, // eslint-disable-line no-underscore-dangle
        attributes: {
          ...networkTemplate.ego.attributes,
          newProperty: 'foo',
        },
      },
    };

    const expectedNetwork = {
      nodes: [
        ...networkTemplate.nodes,
        {
          ...networkTemplate.ego,
          attributes: {
            ...networkTemplate.ego.attributes,
            newProperty: 'foo',
          },
        },
      ],
      edges: networkTemplate.edges,
      sessionVariables: networkTemplate.sessionVariables,
    };

    expect(egoCaster(network)).toEqual(expectedNetwork);
  });
});
