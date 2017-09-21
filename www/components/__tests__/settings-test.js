/* eslint-env jest */

const settings = require('../settings');
const Datastore = require('nedb');

const db = new Datastore({ filename: 'db/test', autoload: true });

describe('settings', () => {
  it('It saves settings to nedb', () => {
    const testSettings = settings(db);

    return testSettings
      .set({
        foo: 'bar',
        baz: 'buzz',
      })
      .then(() => testSettings.get())
      .then(results => expect(results).toEqual({
        _id: 'settings',
        baz: 'buzz',
        foo: 'bar',
      }));
  });
});
