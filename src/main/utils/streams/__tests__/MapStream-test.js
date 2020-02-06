/* eslint-env jest */

const MapStream = require('../MapStream');

describe('MapStream', () => {
  it('calls the map function on each data chunk', (done) => {
    const streamData = ['hello', 'world'];
    const expectedResult = ['olleh', 'dlrow'];

    const mockMap = jest.fn(
      (data, cb) =>
        cb(null, data.toString().split('').reverse().join('')),
    );
    const mapStream = new MapStream(mockMap);
    const streamOutput = [];

    mapStream.on('data', (data) => {
      streamOutput.push(data.toString());
    });

    mapStream.on('finish', () => {
      const calledWith = mockMap.mock.calls.map(item => item[0].toString());
      expect(calledWith).toEqual(streamData);
      expect(streamOutput).toEqual(expectedResult);
      done();
    });

    streamData.forEach((item) => {
      mapStream.write(item);
    });

    mapStream.end();
  });
});
