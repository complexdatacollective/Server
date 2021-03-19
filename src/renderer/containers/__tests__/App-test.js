/* eslint-env jest */
import React from 'react';
import { mount, shallow } from 'enzyme';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import { ipcRenderer } from 'electron';
import AdminApiClient from '../../utils/adminApiClient';
import { ConnectedApp, UnconnectedApp as App } from '../App';
import ipcChannels from '../../utils/ipcChannels';
import { isFrameless } from '../../utils/environment';

jest.mock('electron-log');
jest.mock('../ProtocolNav', () => 'mock-protocol-nav');
jest.mock('../DeviceStatus');
jest.mock('../../utils/environment');
jest.mock('../../utils/adminApiClient', () => ({ setPort: jest.fn() }));
jest.mock('../../hooks/useUpdater');
jest.mock('react-redux', () => ({
  ...(jest.requireActual('react-redux')),
  useDispatch: jest.fn(),
}));

const mockDispatched = {
  ackPairingRequest: jest.fn(),
  completedPairingRequest: jest.fn(),
  newPairingRequest: jest.fn(),
  dismissPairingRequest: jest.fn(),
  loadDevices: jest.fn(),
  loadProtocols: jest.fn(),
  resetApp: jest.fn(),
  setConnectionInfo: jest.fn(),
  addToast: jest.fn(),
  updateToast: jest.fn(),
  removeToast: jest.fn(),
  history: {
    push: jest.fn(),
  },
};

// This is madness. See here: https://github.com/enzymejs/enzyme/issues/2086
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useEffect: (f) => f(),
}));

describe('<App />', () => {
  beforeEach(() => {
    Object.values(mockDispatched).forEach((mockFn) => {
      if (typeof mockFn === 'function') {
        mockFn.mockClear();
      }
    });
  });

  const mockStore = createStore(() => (
    {
      toasts: [],
      dialogs: { dialogs: [] },
    }
  ));

  it('does not render routes before API is ready', () => {
    const wrapper = shallow(<App {...mockDispatched} />);
    expect(wrapper.find('AppRoutes')).toHaveLength(0);
  });

  describe('API IPC', () => {
    it('requests connection info when created', () => {
      mount(<Provider store={mockStore}><App {...mockDispatched} /></Provider>);
      expect(ipcRenderer.send).toHaveBeenCalledWith(ipcChannels.REQUEST_API_INFO);
    });

    it('registers a callback for connection info', () => {
      shallow(<App {...mockDispatched} />);
      expect(ipcRenderer.once).toHaveBeenCalledWith(
        ipcChannels.API_INFO,
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

      it('sets the dynamic port for all clients', () => {
        shallow(<App {...mockDispatched} />);
        callOnce(ipcChannels.ApiConnectionInfoChannel, { adminService: { port: 12345 } });
        expect(AdminApiClient.setPort).toHaveBeenCalledWith(12345);
      });

      it('sets redux state', () => {
        const connectionInfo = { adminService: { port: 12345 } };
        shallow(<App {...mockDispatched} />);
        callOnce(ipcChannels.ApiConnectionInfoChannel, connectionInfo);
        expect(mockDispatched.setConnectionInfo).toHaveBeenCalledWith(connectionInfo);
      });

      it('does not crash when adminService unavailable', () => {
        shallow(<App {...mockDispatched} />);
        callOnce(ipcChannels.ApiConnectionInfoChannel, {});
        expect(mockDispatched.setConnectionInfo).toHaveBeenCalled();
      });
    });
  });

  describe('frame', () => {
    it('provides css modifier for a frameless version', () => {
      isFrameless.mockReturnValue(true);
      expect(shallow(<App {...mockDispatched} />).hasClass('app--frameless')).toBe(true);
    });

    it('provides css modifier for a frameless version', () => {
      isFrameless.mockReturnValue(false);
      expect(shallow(<App {...mockDispatched} />).hasClass('app--frameless')).toBe(false);
    });
  });

  describe('native drag/drop events', () => {
    let handlers;
    let spy;
    beforeEach(() => {
      spy = jest.spyOn(document, 'addEventListener').mockImplementation((name, cb) => handlers.push(cb));
      handlers = [];
    });

    afterEach(() => {
      spy.mockReset();
    });

    it('registers a document drop handler to prevent default browser handling', () => {
      document.addEventListener = jest.fn();
      shallow(<App {...mockDispatched} />);
      expect(document.addEventListener).toHaveBeenCalledWith('drop', expect.any(Function));
    });

    it('prevents default event handling', () => {
      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      };
      shallow(<App {...mockDispatched} />);
      handlers.forEach((handler) => handler(mockEvent));
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('when connected', () => {
    it('provides pairing actions', () => {
      const wrapper = shallow(<ConnectedApp store={mockStore} />);
      expect(wrapper.prop('ackPairingRequest')).toBeInstanceOf(Function);
      expect(wrapper.prop('completedPairingRequest')).toBeInstanceOf(Function);
      expect(wrapper.prop('dismissPairingRequest')).toBeInstanceOf(Function);
      expect(wrapper.prop('newPairingRequest')).toBeInstanceOf(Function);
    });
  });
});
