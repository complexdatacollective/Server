import { remote } from 'electron';

const codenames = {
  '4.0.0-alpha.2': 'Anning',
};

const appVersion = remote.app.getVersion();
const codename = codenames[appVersion];

export default appVersion;

export {
  codename,
  appVersion,
};
