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
    const subject = getNetworkResolver(
      '/dev/null',
      { codebook: {} },
    );

    expect(subject).toBeInstanceOf(Function);
  });

  describe('networkResolver()', () => {
    it('returns a promise', () => {
      const networkResolver = getNetworkResolver(
        '/dev/null',
        { codebook },
      );

      expect(networkResolver(network)).toBeInstanceOf(Promise);
    });

    it('when network is empty it returns an empty array', (done) => {
      const networkResolver = getNetworkResolver(
        '/dev/null',
        { codebook },
      );

      networkResolver({ nodes: [] })
        .then((resolver) => {
          const result = [];

          resolver.on('data', (data) => {
            result.push(JSON.parse(data));
          });

          resolver.on('finish', () => {
            expect(result).toEqual([]);
            done();
          });
        });
    });

    it('promise resolves to a stream of json objects', (done) => {
      const networkResolver = getNetworkResolver(
        '/dev/null',
        { codebook },
      );

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
            done();
          });
        });
    });
  });
});
