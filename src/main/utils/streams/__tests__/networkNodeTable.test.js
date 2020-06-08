/* eslint-env jest */

const miss = require('mississippi');
const { csvEOL } = require('../../formatters/csv');
const { nodePrimaryKeyProperty, nodeAttributesProperty, entityTypeProperty, egoProperty } = require('../../formatters/network');
const networkNodeTable = require('../networkNodeTable');

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
  let output;

  return miss.pipe(
    stream,
    miss.concat((data) => {
      output = data.toString().split(csvEOL);
    }),
    (err) => {
      if (err) { return reject(err); }

      return resolve(output);
    },
  );
});

describe('networkNodeTable', () => {
  it('returns all headings', async () => {
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

    const [headings] = await readLines(networkNodeTable(codebook));
    expect(headings).toEqual('networkCanvasAlterID,networkCanvasNodeType,networkCanvasEgoID,name,age,venue name,location');
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

    const [, firstRow] = await readLines(networkNodeTable(mockCodebook, nodes));
    expect(firstRow).toEqual('cce4044d-c171-4f25-8377-b28616e90006,person,,Bob,50');
  });

  it('escapes quotes', async () => {
    const nodes = [{
      [nodePrimaryKeyProperty]: 'cce4044d-c171-4f25-8377-b28616e90006',
      [entityTypeProperty]: 'person',
      [nodeAttributesProperty]: {
        '0c3cc033-aca6-424e-bde7-6cdff7c20da6': '"Bob"',
      },
    }];

    const [, firstRow] = await readLines(networkNodeTable(mockCodebook, nodes));

    expect(firstRow).toEqual('cce4044d-c171-4f25-8377-b28616e90006,person,,"""Bob""",');
  });

  it('escapes quotes in attr names', async () => {
    const codebook = {
      nodes: {
        person: {
          variables: {
            '0c3cc033-aca6-424e-bde7-6cdff7c20da6': { name: '"name"' },
            'e3e8a80b-7cf0-4a70-93f9-6b8049b2c347': { name: 'age' },
          },
        },
      },
    };

    const [headings] = await readLines(networkNodeTable(codebook));

    expect(headings).toEqual('networkCanvasAlterID,networkCanvasNodeType,networkCanvasEgoID,"""name""",age');
  });

  it('stringifies and quotes objects', async () => {
    const nodes = [{
      [nodePrimaryKeyProperty]: 'cce4044d-c171-4f25-8377-b28616e90006',
      [entityTypeProperty]: 'person',
      [nodeAttributesProperty]: {
        'e3e8a80b-7cf0-4a70-93f9-6b8049b2c347': { x: 1, y: 1 },
      },
    }];

    const [, firstRow] = await readLines(networkNodeTable(mockCodebook, nodes));

    expect(firstRow).toEqual('cce4044d-c171-4f25-8377-b28616e90006,person,,,"{""x"":1,""y"":1}"');
  });

  it('exports undefined values as blank', async () => {
    const nodes = [{
      [nodePrimaryKeyProperty]: 'cce4044d-c171-4f25-8377-b28616e90006',
      [entityTypeProperty]: 'person',
      [nodeAttributesProperty]: {
        '0c3cc033-aca6-424e-bde7-6cdff7c20da6': undefined,
      },
    }];

    const [, firstRow] = await readLines(networkNodeTable(mockCodebook, nodes));

    expect(firstRow).toEqual('cce4044d-c171-4f25-8377-b28616e90006,person,,,');
  });

  it('exports null values as blank', async () => {
    const nodes = [{
      [nodePrimaryKeyProperty]: 'cce4044d-c171-4f25-8377-b28616e90006',
      [entityTypeProperty]: 'person',
      [nodeAttributesProperty]: {
        '0c3cc033-aca6-424e-bde7-6cdff7c20da6': null,
      },
    }];

    const [, firstRow] = await readLines(networkNodeTable(mockCodebook, nodes));

    expect(firstRow).toEqual('cce4044d-c171-4f25-8377-b28616e90006,person,,,');
  });

  it('exports `false` values as "false"', async () => {
    const nodes = [{
      [nodePrimaryKeyProperty]: 'cce4044d-c171-4f25-8377-b28616e90006',
      [entityTypeProperty]: 'person',
      [nodeAttributesProperty]: {
        '0c3cc033-aca6-424e-bde7-6cdff7c20da6': false,
      },
    }];

    const [, firstRow] = await readLines(networkNodeTable(mockCodebook, nodes));

    expect(firstRow).toEqual('cce4044d-c171-4f25-8377-b28616e90006,person,,false,');
  });

  it('exports egoID', async () => {
    const nodes = [{
      [nodePrimaryKeyProperty]: 'cce4044d-c171-4f25-8377-b28616e90006',
      [entityTypeProperty]: 'person',
      [egoProperty]: '0861a8d7-736c-4edd-af04-1c02a9d4259f',
      [nodeAttributesProperty]: {
        '0c3cc033-aca6-424e-bde7-6cdff7c20da6': false,
      },
    }];

    const [, firstRow] = await readLines(networkNodeTable(mockCodebook, nodes));

    expect(firstRow).toEqual('cce4044d-c171-4f25-8377-b28616e90006,person,0861a8d7-736c-4edd-af04-1c02a9d4259f,false,');
  });
});
