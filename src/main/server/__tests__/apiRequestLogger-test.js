/* eslint-env jest */
const apiRequestLogger = require('../apiRequestLogger');
const logger = require('electron-log');

jest.mock('electron-log');

const mockReq = { method: 'GET', url: '/' };
const mockRes = { statusCode: 200 };
const mockNext = jest.fn();

describe('API request logger', () => {
  it('logs requests as info', () => {
    apiRequestLogger()(mockReq, mockRes, mockNext);
    expect(logger.info).toHaveBeenCalled();
  });
});
