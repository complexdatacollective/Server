import { remote } from 'electron';

const codenames = {
  '4.0.0-alpha.2': 'Anning',
  '4.0.0-alpha.3': 'Hercules',
  '4.0.0-alpha.4': 'Gold-Bug',
  '4.0.0-alpha.8': 'Lochs & Glens',
  '4.0.0-alpha.9': 'Arrakis',
};

const appVersion = remote.app.getVersion();
const codename = codenames[appVersion];

export default appVersion;

export {
  codename,
  appVersion,
};
