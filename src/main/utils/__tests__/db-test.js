/* eslint-env jest */

import { mostRecent, resolveOrReject } from '../db';

describe('db helpers', () => {
  describe('mostRecent', () => {
    it('sorts on createdAt', () => {
      expect(mostRecent.createdAt).toBe(-1);
    });
  });

  describe('resolveOrReject', () => {
    it('converts error callback to rejection', () => {
      const err = new Error('some-error');
      const promise = new Promise((resolve, reject) => resolveOrReject(resolve, reject)(err));
      expect(promise).rejects.toMatchObject({ message: err.message });
    });

    it('converts success callback to resolved promise', () => {
      const promise = new Promise((resolve, reject) => resolveOrReject(resolve, reject)(null, 9));
      expect(promise).resolves.toBe(9);
    });
  });
});
