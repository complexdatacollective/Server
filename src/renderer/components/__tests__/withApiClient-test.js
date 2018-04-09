/* eslint-env jest */
import React from 'react';
import { mount, shallow } from 'enzyme';
import { ipcRenderer } from 'electron';

import withApiClient, { IPC } from '../withApiClient';
import AdminApiClient from '../../utils/adminApiClient';

jest.mock('electron');

describe('withApiClient HOC', () => {
  let MockComponent;

  beforeAll(() => {
    MockComponent = () => (<div />);
  });

  it('Provides an apiClient prop to the wrapped component', () => {
    const unwrapped = shallow(<MockComponent />);
    const wrapped = shallow(React.createElement(withApiClient(MockComponent)));
    expect(unwrapped.prop('apiClient')).not.toBeDefined();
    expect(wrapped.prop('apiClient')).toBeDefined();
    expect(wrapped.is('MockComponent')).toBe(true);
  });

  describe('IPC', () => {
    it('requests API connection info when created', () => {
      React.createElement(withApiClient(MockComponent));
      expect(ipcRenderer.send).toHaveBeenCalledWith(IPC.RequestApiConnectionInfoChannel);
    });

    it('registers a callback for API connection info', () => {
      React.createElement(withApiClient(MockComponent));
      expect(ipcRenderer.once).toHaveBeenCalledWith(
        IPC.ApiConnectionInfoChannel,
        expect.any(Function),
      );
    });

    describe('when notified by server', () => {
      let callOnce;
      beforeAll(() => {
        ipcRenderer.once.mockImplementation((channel, cb) => {
          callOnce = cb;
        });
      });

      it('creates an apiClient in state when server ready', () => {
        const mounted = mount(React.createElement(withApiClient(MockComponent)));
        expect(mounted.state('apiClient')).toBeNull();
        callOnce(IPC.ApiConnectionInfoChannel, { port: 12345 });
        expect(mounted.state('apiClient')).toBeInstanceOf(AdminApiClient);
      });

      it('passes apiClient state to child props', () => {
        const mounted = mount(React.createElement(withApiClient(MockComponent)));
        callOnce(IPC.ApiConnectionInfoChannel, { port: 12345 });
        mounted.mount(); // re-mount to force props change from state
        expect(mounted.find('MockComponent').prop('apiClient')).toBeInstanceOf(AdminApiClient);
      });
    });
  });
});
