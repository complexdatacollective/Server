/* eslint-env jest */

const miss = require('mississippi');
const tableToCsv = require('../tableToCsv');

const csvEOL = '\r\n';

const streamLines = (stream) => (lines) => new Promise((resolve, reject) => {
  let output;

  return miss.pipe(
    miss.from({ objectMode: true }, (size, next) => {
      if (lines.length <= 0) { return next(null, null); }

      const nextLine = JSON.stringify(lines.shift());

      return next(null, nextLine);
    }),
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

describe('tableToCsv', () => {
  it('escapes quotes', async () => {
    const rows = [
      [
        'id',
        'type',
        'name',
      ],
      [
        'cce4044d-c171-4f25-8377-b28616e90006',
        'person',
        '"Bob"',
      ],
    ];

    const [headings, firstRow] = await streamLines(tableToCsv())(rows);

    expect(headings).toEqual('id,type,name');
    expect(firstRow).toEqual('cce4044d-c171-4f25-8377-b28616e90006,person,"""Bob"""');
  });

  it('stringifies and quotes objects', async () => {
    const rows = [
      [
        'cce4044d-c171-4f25-8377-b28616e90006',
        'person',
        { x: 1, y: 1 },
      ],
    ];

    const [result] = await streamLines(tableToCsv())(rows);

    expect(result).toEqual('cce4044d-c171-4f25-8377-b28616e90006,person,"{""x"":1,""y"":1}"');
  });

  it('exports undefined values as blank', async () => {
    const rows = [
      [
        'cce4044d-c171-4f25-8377-b28616e90006',
        undefined,
        'person',
      ],
    ];

    const [result] = await streamLines(tableToCsv())(rows);

    expect(result).toEqual('cce4044d-c171-4f25-8377-b28616e90006,,person');
  });

  it('exports null values as blank', async () => {
    const rows = [
      [
        'cce4044d-c171-4f25-8377-b28616e90006',
        null,
        'person',
      ],
    ];

    const [result] = await streamLines(tableToCsv())(rows);

    expect(result).toEqual('cce4044d-c171-4f25-8377-b28616e90006,,person');
  });

  it('exports `false` values as "false"', async () => {
    const rows = [
      [
        'cce4044d-c171-4f25-8377-b28616e90006',
        false,
        'person',
      ],
    ];

    const [result] = await streamLines(tableToCsv())(rows);

    expect(result).toEqual('cce4044d-c171-4f25-8377-b28616e90006,false,person');
  });
});
