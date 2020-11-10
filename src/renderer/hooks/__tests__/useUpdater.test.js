/* eslint-env jest */
import * as Env from '../../utils/environment';
import { checkEndpoint, getPlatformSpecificContent } from '../useUpdater';

jest.useFakeTimers();

const mockAssets = [
  {
    url: 'https://website.com/assets/17474844',
    id: 17474844,
    node_id: 'MDEyOlJlbGVhc2VBc3NldDE3NDc0ODQ0',
    name: 'latest.yml',
    content_type: 'text/yaml',
    size: 356,
    created_at: '2020-01-21T09:30:44Z',
    updated_at: '2020-01-21T09:30:44Z',
    browser_download_url: 'https://website.com/latest.yml',
  },
  {
    url: 'https://website.com/assets/17477882',
    id: 17477882,
    node_id: 'MDEyOlJlbGVhc2VBc3NldDE3NDc3ODgy',
    name: 'installer.zip',
    content_type: 'application/zip',
    size: 64547558,
    created_at: '2020-01-21T12:00:35Z',
    updated_at: '2020-01-21T12:13:21Z',
    browser_download_url: 'https://website.com/installer.zip',
  },
  {
    url: 'https://website.com/assets/17474888',
    id: 17474888,
    node_id: 'MDEyOlJlbGVhc2VBc3NldDE3NDc0ODg4',
    name: 'installer.dmg',
    content_type: 'application/octet-stream',
    size: 64860211,
    created_at: '2020-01-21T09:32:48Z',
    updated_at: '2020-01-21T09:34:59Z',
    browser_download_url: 'https://website.com/installer.dmg',
  },
  {
    url: 'https://website.com/assets/17474842',
    id: 17474842,
    node_id: 'MDEyOlJlbGVhc2VBc3NldDE3NDc0ODQy',
    name: 'installer.exe',
    content_type: 'application/octet-stream',
    size: 47551168,
    created_at: '2020-01-21T09:30:34Z',
    updated_at: '2020-01-21T09:30:43Z',
    browser_download_url: 'https://website.com/installer.exe',
  },
];

const mockJson = jest.fn(() => ({
  name: '1.0.0',
  body: 'This is a newer version probably',
  assets: mockAssets, // eslint-disable-line
}));


describe('getPlatformSpecificContent()', () => {
  beforeEach(() => {
    Env.isWindows = jest.fn().mockReturnValue(false);
    Env.isMacOS = jest.fn().mockReturnValue(false);
    Env.isLinux = jest.fn().mockReturnValue(false);
  });

  afterEach(() => {
    Env.isWindows = jest.fn().mockReturnValue(false);
    Env.isMacOS = jest.fn().mockReturnValue(false);
    Env.isLinux = jest.fn().mockReturnValue(false);
  });

  it('gets EXE asset for Windows platform', () => {
    Env.isWindows = jest.fn().mockReturnValue(true);

    const content = getPlatformSpecificContent(mockAssets);
    expect(content.buttonLink).toBe('https://website.com/installer.exe');
  });

  it('gets DMG asset for macoS platform', () => {
    Env.isMacOS = jest.fn().mockReturnValue(true);

    const content = getPlatformSpecificContent(mockAssets);
    expect(content.buttonLink).toBe('https://website.com/installer.dmg');
  });

  it('links to GitHub for Linux platform', () => {
    Env.isLinux = jest.fn().mockReturnValue(true);

    const content = getPlatformSpecificContent(mockAssets);
    expect(content.buttonLink).toBe('https://github.com/complexdatacollective/Server/releases/latest');
  });

  it('links to download page if asset not available', () => {
    Env.isLinux = jest.fn().mockReturnValue(true);

    const content = getPlatformSpecificContent([]);
    expect(content.buttonLink).toBe('https://networkcanvas.com/download.html');
  });
});


describe('checkEndpoint()', () => {
  let originalFetch;

  beforeAll(() => {
    originalFetch = global.fetch;
    global.fetch = jest.fn(() => Promise.resolve({ json: mockJson }));
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('when app is the latest version', async () => {
    const subject = await checkEndpoint('foo', '1.0.0');
    expect(subject).toBe(false);
  });

  it('when app is a later version than the released version!', async () => {
    const subject = await checkEndpoint('foo', '2.0.0');
    expect(subject).toBe(false);
  });

  it('when there is an update available', async () => {
    const subject = await checkEndpoint('foo', '0.5.0');
    expect(subject).toEqual({
      newVersion: '1.0.0',
      releaseNotes: 'This is a newer version probably',
      releaseButtonContent: {
        buttonLink: 'https://networkcanvas.com/download.html',
        buttonText: 'Open Download Page',
      },
    });
  });

  it('fails silently', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('bad url')));

    const subject = await checkEndpoint('foo', '0.5.0');

    expect(subject).toEqual(false);
  });
});
