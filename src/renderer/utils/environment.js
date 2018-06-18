import { remote } from 'electron';

const isFrameless = () => remote.process.platform === 'darwin';

export {
  isFrameless, // eslint-disable-line import/prefer-default-export
};
