/* eslint-env jest */
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

  it('returns a networkResolver function', () => {
    const subject = getNetworkResolver({
      command: '/dev/null',
      codebook: {},
    });

    expect(subject).toBeInstanceOf(Function);
  });

  describe('networkResolver()', () => {
    it('returns a promise', () => {
      const networkResolver = getNetworkResolver({
        command: '/dev/null',
        codebook,
      });

      expect(networkResolver(network)).toBeInstanceOf(Promise);
    });

    it('promise resolves to a stream of json objects', (done) => {
      const networkResolver = getNetworkResolver({
        command: '/dev/null',
        codebook,
      });

      networkResolver(network)
        .then((resolver) => {
          const result = [];

          resolver.on('data', (data) => {
            result.push(JSON.parse(data));
          });

          resolver.on('finish', () => {
            expect(result).toEqual([
              {
                nodes: [
                  {
                    _uid: 'abc1',
                    attributes: { foo: 'foo' },
                  },
                  {
                    _uid: 'abc2',
                    attributes: { foo: 'bar' },
                  },
                ],
                probability: 0.5,
              },
              {
                nodes: [
                  {
                    _uid: 'abc3',
                    attributes: { foo: 'bazz' },
                  },
                  {
                    _uid: 'abc4',
                    attributes: { foo: 'buzz' },
                  },
                ],
                probability: 0.5,
              },
            ]);
            done();
          });
        });
    });
  });
});
