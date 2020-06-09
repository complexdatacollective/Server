/* eslint-env jest */

const miss = require('mississippi');
const { csvEOL } = require('../../formatters/csv');
const arrayToCsv = require('../arrayToCsv');


const streamLines = stream =>
  lines => new Promise((resolve, reject) => {
    let output;

    return miss.pipe(
      miss.from({ objectMode: true }, (size, next) => {
        if (lines.length <= 0) { return next(null, null); }

        const nextLine = lines.shift();

        return next(null, nextLine);
      }),
      stream,
      miss.concat((data) => {
        output = data.split(csvEOL);
      }),
      (err) => {
        if (err) { return reject(err); }

        return resolve(output);
      },
    );
  });

describe('arrayToCsv', () => {
  it('escapes quotes', async () => {
    const rows = [
      [
        'cce4044d-c171-4f25-8377-b28616e90006',
        'person',
        '"Bob"',
      ],
    ];

    const [result] = await streamLines(arrayToCsv())(rows);

    expect(result).toEqual('cce4044d-c171-4f25-8377-b28616e90006,person,"""Bob"""');
  });

  it('stringifies and quotes objects', async () => {
    const rows = [
      [
        'cce4044d-c171-4f25-8377-b28616e90006',
        'person',
        { x: 1, y: 1 },
      ],
    ];

    const [result] = await streamLines(arrayToCsv())(rows);

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

    const [result] = await streamLines(arrayToCsv())(rows);

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

    const [result] = await streamLines(arrayToCsv())(rows);

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

    const [result] = await streamLines(arrayToCsv())(rows);

    expect(result).toEqual('cce4044d-c171-4f25-8377-b28616e90006,false,person');
  });
});
