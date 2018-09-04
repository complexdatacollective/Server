/* eslint-env jest */
import electron from 'electron';
import { isFrameless } from '../environment';

jest.mock('electron');

describe('environment', () => {
  it('is not frameless by default', () => {
    expect(isFrameless()).toBe(false);
  });

  it('is frameless on macOS', () => {
    electron.remote.process.platform = 'darwin';
    expect(isFrameless()).toBe(true);
  });
});
