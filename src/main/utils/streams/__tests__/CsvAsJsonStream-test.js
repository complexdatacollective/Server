/* eslint-env jest */

const CsvAsJsonStream = require('../CsvAsJsonStream');

describe('CsvAsJsonStream', () => {
  it('converts a csv table into a stream of json objects using the first chuck as the headings', (done) => {
    const streamData = [
      'first_name,last_name, value0',
      'Frodo,Baggins, 5',
      'Nick", Carraway,7',
      'Don,"Quixote",3',
    ];

    const expectedResult = [
      { first_name: 'Frodo', last_name: 'Baggins', value0: '5' },
      { first_name: 'Nick"', last_name: 'Carraway', value0: '7' },
      { first_name: 'Don', last_name: 'Quixote', value0: '3' },
    ];
    const csvAsJsonStream = new CsvAsJsonStream();
    const streamOutput = [];

    csvAsJsonStream.on('data', (data) => {
      streamOutput.push(JSON.parse(data.toString()));
    });

    csvAsJsonStream.on('finish', () => {
      expect(streamOutput).toEqual(expectedResult);
      done();
    });

    streamData.forEach((item) => {
      csvAsJsonStream.write(item);
    });

    csvAsJsonStream.end();
  });

  it("throws an error if row doesn't match headings", (done) => {
    const streamData = [
      'first_name,last_name, value0',
      'Frodo,Baggins, 5',
      'Nick, Carraway',
    ];

    const csvAsJsonStream = new CsvAsJsonStream();

    csvAsJsonStream.on('error', (err) => {
      expect(err).toEqual('Length values does not match length of headings (in first row).');
      done();
    });

    streamData.forEach((item) => {
      csvAsJsonStream.write(item);
    });

    csvAsJsonStream.end();
  });
});
