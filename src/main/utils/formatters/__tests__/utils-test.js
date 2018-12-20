/* eslint-env jest */

const { formats, formatsAreValid, getFileExtension, getFormatterClass } = require('../utils');
const { GraphMLFormatter } = require('../index');

describe('formatter utilities', () => {
  describe('getFileExtension', () => {
    it('maps CSV types', () => {
      expect(getFileExtension(formats.adjacencyMatrix)).toEqual('.csv');
      expect(getFileExtension(formats.adjacencyList)).toEqual('.csv');
      expect(getFileExtension(formats.attributeList)).toEqual('.csv');
    });
  });

  describe('getFormatterClass', () => {
    it('maps graphml to its formatter', () => {
      expect(getFormatterClass(formats.graphml)).toEqual(GraphMLFormatter);
    });

    it('maps each format to a class', () => {
      Object.keys(formats).forEach((format) => {
        expect(getFormatterClass(format)).toBeDefined();
      });
    });
  });

  describe('formatsAreValid', () => {
    it('recognizes formats', () => {
      expect(formatsAreValid(['graphml'])).toBe(true);
    });

    it('requires an array', () => {
      expect(formatsAreValid()).toBe(false);
    });

    it('checks for invalid formats', () => {
      expect(formatsAreValid(['graphml', 'not-a-format'])).toBe(false);
    });
  });
});
