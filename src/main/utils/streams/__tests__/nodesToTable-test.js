/* eslint-env jest */

const miss = require('mississippi');
const { nodePrimaryKeyProperty, nodeAttributesProperty, entityTypeProperty, egoProperty } = require('../../formatters/network');
const nodesToTable = require('../nodesToTable');

const mockCodebook = {
  node: {
    person: {
      variables: {
        '0c3cc033-aca6-424e-bde7-6cdff7c20da6': { name: 'name' },
        'e3e8a80b-7cf0-4a70-93f9-6b8049b2c347': { name: 'age' },
      },
    },
  },
};

const readLines = stream => new Promise((resolve, reject) => {
  const output = [];

  return miss.pipe(
    stream,
    // miss.through({ objectMode: true }, (data, enc, cb) => {
    //   cb(null, JSON.parse(data.toString()));
    // }),
    miss.to({ objectMode: true }, (data, enc, cb) => {
      output.push(data);
      cb();
    }),
    (err) => {
      if (err) { return reject(err); }

      return resolve(output);
    },
  );
});

describe('nodesToTable', () => {
  it('returns all headings with blank non matching properties', async () => {
    const codebook = {
      node: {
        person: {
          variables: {
            '0c3cc033-aca6-424e-bde7-6cdff7c20da6': { name: 'name' },
            'e3e8a80b-7cf0-4a70-93f9-6b8049b2c347': { name: 'age' },
          },
        },
        venue: {
          variables: {
            '1c3cc033-aca6-424e-bde7-6cdff7c20da6': { name: 'venue name' },
            '23e8a80b-7cf0-4a70-93f9-6b8049b2c347': { name: 'location' },
          },
        },
      },
    };

    const nodes = [{
      [nodePrimaryKeyProperty]: 'cce4044d-c171-4f25-8377-b28616e90006',
      [entityTypeProperty]: 'person',
      [nodeAttributesProperty]: {
        '0c3cc033-aca6-424e-bde7-6cdff7c20da6': 'Bob',
        'e3e8a80b-7cf0-4a70-93f9-6b8049b2c347': 50,
      },
    }];

    const [headings, firstRow] = await readLines(nodesToTable(codebook, null, nodes));
    expect(headings).toEqual(['networkCanvasAlterID', 'networkCanvasNodeType', 'name', 'age', 'venue name', 'location']);
    expect(firstRow).toEqual(['cce4044d-c171-4f25-8377-b28616e90006', 'person', 'Bob', 50, undefined, undefined]);
  });

  it('writes a simple CSV', async () => {
    const nodes = [{
      [nodePrimaryKeyProperty]: 'cce4044d-c171-4f25-8377-b28616e90006',
      [entityTypeProperty]: 'person',
      [nodeAttributesProperty]: {
        '0c3cc033-aca6-424e-bde7-6cdff7c20da6': 'Bob',
        'e3e8a80b-7cf0-4a70-93f9-6b8049b2c347': 50,
      },
    }];

    const [, firstRow] = await readLines(nodesToTable(mockCodebook, null, nodes));

    expect(firstRow).toEqual(['cce4044d-c171-4f25-8377-b28616e90006', 'person', 'Bob', 50]);
  });

  it('exports egoID', async () => {
    const nodes = [{
      [nodePrimaryKeyProperty]: 'cce4044d-c171-4f25-8377-b28616e90006',
      [entityTypeProperty]: 'person',
      [egoProperty]: '0861a8d7-736c-4edd-af04-1c02a9d4259f',
      [nodeAttributesProperty]: {
        '0c3cc033-aca6-424e-bde7-6cdff7c20da6': false,
        'e3e8a80b-7cf0-4a70-93f9-6b8049b2c347': 50,
      },
    }];

    const [headings, firstRow] = await readLines(
      nodesToTable(mockCodebook, { includeEgo: true }, nodes),
    );

    expect(headings).toEqual(['networkCanvasAlterID', 'networkCanvasNodeType', 'networkCanvasEgoID', 'name', 'age']);
    expect(firstRow).toEqual(['cce4044d-c171-4f25-8377-b28616e90006', 'person', '0861a8d7-736c-4edd-af04-1c02a9d4259f', false, 50]);
  });
});
