/* eslint-env jest */
import {
  formatDate,
  formatDatetime,
  formatDecimal,
} from '../formatters';

const mockDate = new Date(2019, 1, 1);

describe('formatDate', () => {
  it('transforms a Date to a string', () => {
    expect(formatDate(mockDate)).toMatch('19');
  });
});

describe('formatDatetime', () => {
  it('transforms a Date to a string', () => {
    expect(formatDatetime(mockDate)).toMatch('19');
  });
});

describe('formatDecimal', () => {
  it('transforms a Number to a string', () => {
    expect(formatDecimal(23.2)).toEqual('23.2');
  });
  it('transforms NaN to an empty string', () => {
    expect(formatDecimal(NaN)).toEqual('');
  });
});
