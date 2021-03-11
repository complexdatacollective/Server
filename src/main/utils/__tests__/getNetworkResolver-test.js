/* eslint-env jest */
const uuid = require('uuid/v4');
const miss = require('mississippi');
const { getNetworkResolver } = require('../getNetworkResolver');

jest.mock('../../utils/commandRunner');

describe('getNetworkResolver()', () => {
  const codebook = {
    node: {
      foo: {
        variables: {
          foo: {
            type: 'string',
            name: 'FOO',
          },
        },
      },
    },
  };

  const network = {
    nodes: [
      {
        _uid: 'abc1',
        type: 'foo',
        attributes: { foo: 'foo' },
      },
      {
        _uid: 'abc2',
        type: 'foo',
        attributes: { foo: 'bar' },
      },
      {
        _uid: 'abc3',
        type: 'foo',
        attributes: { foo: 'bazz' },
      },
      {
        _uid: 'abc4',
        type: 'foo',
        attributes: { foo: 'buzz' },
      },
    ],
  };

  it('returns a networkResolver promise', () => {
    const subject = getNetworkResolver(
      '/dev/null',
      { codebook: {} },
    );

    expect(subject).toBeInstanceOf(Promise);
  });

  describe('networkResolver()', () => {
    const defaultArgs = [
      uuid(),
      '/dev/null',
      codebook,
      network,
    ];

    it('resolves to an abortable stream', (done) => {
      getNetworkResolver(...defaultArgs)
        .then((stream) => {
          stream.abort();
        })
        .finally(done);
    });

    it('when network is empty it returns an empty array', (done) => {
      const mockNetwork = { nodes: [] };
      getNetworkResolver(defaultArgs[0], defaultArgs[1], defaultArgs[2], mockNetwork)
        .then(stream => new Promise((resolve) => {
          const getResult = miss.concat(resolve);
          stream.pipe(getResult);
        }))
        .then((result) => {
          expect(result).toEqual([]);
        })
        .finally(done);
    });

    it('promise resolves to a stream of json objects', (done) => {
      getNetworkResolver(...defaultArgs)
        .then(stream => new Promise((resolve) => {
          const getResult = miss.concat(resolve);
          stream.pipe(getResult);
        }))
        .then((result) => {
          expect(JSON.parse(result.toString())).toEqual([
            {
              nodes: [
                {
                  _uid: 'abc1',
                  attributes: { foo: 'foo' },
                  type: 'foo',
                },
                {
                  _uid: 'abc2',
                  attributes: { foo: 'bar' },
                  type: 'foo',
                },
              ],
              probability: 0.5,
            },
            {
              nodes: [
                {
                  _uid: 'abc3',
                  attributes: { foo: 'bazz' },
                  type: 'foo',
                },
                {
                  _uid: 'abc4',
                  attributes: { foo: 'buzz' },
                  type: 'foo',
                },
              ],
              probability: 0.5,
            },
          ]);
        })
        .finally(done);
    });
  });
});
