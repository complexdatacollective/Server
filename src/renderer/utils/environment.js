import { remote } from 'electron';

const isFrameless = () => remote && remote.process.platform === 'darwin';

const isMacOS = () => process.platform === 'darwin';

const isWindows = () => process.platform === 'win32';

export {
  isFrameless, // eslint-disable-line import/prefer-default-export
  isMacOS,
  isWindows,
};
