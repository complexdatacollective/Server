// const Promise = require('bluebird');
// const Datastore = require('nedb');

// const db = new Datastore({ filename: 'db/app', autoload: true });

const settingsKey = 'settings';

module.exports = (db) => {
  const get = () =>
    new Promise((resolve, reject) => {
      db.findOne({ _id: settingsKey }, (err, serverSettings) => {
        if (err) { reject(err); return; }
        resolve(serverSettings);
      });
    });

  const set = settings =>
    new Promise((resolve, reject) => {
      db.update(
        { _id: settingsKey },
        Object.assign({}, settings, { _id: settingsKey }),
        { upsert: true },
        (err) => {
          if (err) { reject(err); return; }
          resolve(settings);
        },
      );
    });

  return {
    get,
    set,
  };
};
