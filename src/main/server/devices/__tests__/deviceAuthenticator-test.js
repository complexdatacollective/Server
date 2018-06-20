/* eslint-env jest */
import { InvalidCredentialsError, NotAuthorizedError } from 'restify-errors';

import deviceAuthenticator from '../deviceAuthenticator';

let authHandler;

const req = {
  authorization: {},
  getRoute: jest.fn().mockReturnValue(''),
};

const reqWithAuth = {
  ...req,
  authorization: { scheme: 'Basic' },
  username: 'a692d57c-ab0f-4aa4-8e52-565a585990da',
};

const res = { header: jest.fn() };
const next = jest.fn().mockReturnValue(33);

describe('deviceAuthenticator', () => {
  beforeEach(() => {
    authHandler = deviceAuthenticator({ exists: jest.fn().mockResolvedValue(true) });
  });

  describe('when request has valid credentials', () => {
    it('passes to next handler', async () => {
      await authHandler(reqWithAuth, res, next);
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('when request doesn’t use Basic auth', () => {
    it('passes to next handler', async () => {
      await authHandler(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(InvalidCredentialsError));
    });
  });

  describe('when Basic auth request has no credentials', () => {
    it('passes to next handler', async () => {
      await authHandler({ ...req, authorization: { scheme: 'Basic' } }, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(InvalidCredentialsError));
    });
  });

  describe('when request has invalid credentials', () => {
    it('passes to next handler', async () => {
      authHandler = deviceAuthenticator({ exists: jest.fn().mockResolvedValue(false) });
      await authHandler(reqWithAuth, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(NotAuthorizedError));
    });
  });

  describe('when path doesn’t require auth', () => {
    it('passes to next handler', async () => {
      const publicPath = '/no-auth-required';
      req.getRoute.mockReturnValue({ path: publicPath });
      authHandler = deviceAuthenticator({}, [publicPath]);
      await authHandler(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });
  });
});
