/* eslint-env jest */

import { mostRecentlyCreated, resolveOrReject } from '../db';

describe('db helpers', () => {
  describe('mostRecentlyCreated', () => {
    it('sorts on createdAt', () => {
      expect(mostRecentlyCreated.createdAt).toBe(-1);
    });
  });

  describe('resolveOrReject', () => {
    it('converts error callback to rejection', async () => {
      const err = new Error('some-error');
      const promise = new Promise((resolve, reject) => resolveOrReject(resolve, reject)(err));
      await expect(promise).rejects.toMatchObject({ message: err.message });
    });

    it('converts success callback to resolved promise', async () => {
      const promise = new Promise((resolve, reject) => resolveOrReject(resolve, reject)(null, 9));
      await expect(promise).resolves.toBe(9);
    });
  });
});
