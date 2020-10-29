/* eslint-env jest */
import React from 'react';
import { mount, shallow } from 'enzyme';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import { ipcRenderer } from 'electron';
import AdminApiClient from '../../utils/adminApiClient';
import { ConnectedApp, UnconnectedApp as App, IPC } from '../App';
import { isFrameless } from '../../utils/environment';

jest.mock('electron-log');
jest.mock('../ProtocolNav', () => 'mock-protocol-nav');
jest.mock('../DeviceStatus');
jest.mock('../../utils/environment');
jest.mock('../../utils/adminApiClient', () => ({ setPort: jest.fn() }));

const mockDispatched = {
  ackPairingRequest: jest.fn(),
  completedPairingRequest: jest.fn(),
  newPairingRequest: jest.fn(),
  dismissPairingRequest: jest.fn(),
  dismissAppMessage: jest.fn(),
  dismissAppMessages: jest.fn(),
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

describe('<App />', () => {
  beforeEach(() => {
    Object.values(mockDispatched).forEach((mockFn) => {
      if (typeof mockFn === 'function') {
        mockFn.mockClear();
      }
    });
  });

  const mockPairRequest = {};
  const mockMsg = { timestamp: 1529338487695, text: 'ok' };
  const mockStore = createStore(() => (
    {
      appMessages: [mockMsg],
      pairingRequest: mockPairRequest,
      toasts: [],
      dialogs: { dialogs: [] },
    }
  ));

  it('does not render routes before API is ready', () => {
    const wrapper = shallow(<App {...mockDispatched} />);
    expect(wrapper.find('AppRoutes')).toHaveLength(0);
  });

  it('renders its routes once API is ready', () => {
    const wrapper = shallow(<App {...mockDispatched} />);
    wrapper.setState({ apiReady: true });
    expect(wrapper.find('AppRoutes')).toHaveLength(1);
  });

  it('renders queued messages', () => {
    const wrapper = shallow(<App {...mockDispatched} appMessages={[mockMsg]} />);
    expect(wrapper.find('AppMessage')).toHaveLength(1);
  });

  it('renders device pairing prompt when a pending request exists', () => {
    const wrapper = mount(<Provider store={mockStore}><App {...mockDispatched} pairingRequest={{ status: 'pending' }} /></Provider>);
    expect(wrapper.find('PairPrompt')).toHaveLength(1);
  });

  it('does not render device pairing prompt after request acked', () => {
    const wrapper = mount(<Provider store={mockStore}><App {...mockDispatched} pairingRequest={{ status: 'acknowledged' }} /></Provider>);
    expect(wrapper.find('PairPrompt')).toHaveLength(0);
  });

  describe('API IPC', () => {
    it('requests connection info when created', () => {
      shallow(<App {...mockDispatched} />);
      expect(ipcRenderer.send).toHaveBeenCalledWith(IPC.REQUEST_API_INFO);
    });

    it('registers a callback for connection info', () => {
      shallow(<App {...mockDispatched} />);
      expect(ipcRenderer.once).toHaveBeenCalledWith(
        IPC.API_INFO,
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
        callOnce(IPC.ApiConnectionInfoChannel, { adminService: { port: 12345 } });
        expect(AdminApiClient.setPort).toHaveBeenCalledWith(12345);
      });

      it('sets redux state', () => {
        const connectionInfo = { adminService: { port: 12345 } };
        shallow(<App {...mockDispatched} />);
        callOnce(IPC.ApiConnectionInfoChannel, connectionInfo);
        expect(mockDispatched.setConnectionInfo).toHaveBeenCalledWith(connectionInfo);
      });

      it('does not crash when adminService unavailable', () => {
        shallow(<App {...mockDispatched} />);
        callOnce(IPC.ApiConnectionInfoChannel, {});
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
      handlers.forEach(handler => handler(mockEvent));
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('when connected', () => {
    let app;
    beforeEach(() => {
      app = shallow(<ConnectedApp store={mockStore} {...mockDispatched} />).dive();
    });

    it('maps messages from state', () => {
      expect(app.prop('appMessages')).toContain(mockMsg);
    });

    it('maps messages from state', () => {
      expect(app.prop('pairingRequest')).toBe(mockPairRequest);
    });

    it('provides pairing actions', () => {
      const wrapper = shallow(<ConnectedApp store={mockStore} />).dive();
      expect(wrapper.prop('ackPairingRequest')).toBeInstanceOf(Function);
      expect(wrapper.prop('completedPairingRequest')).toBeInstanceOf(Function);
      expect(wrapper.prop('dismissPairingRequest')).toBeInstanceOf(Function);
      expect(wrapper.prop('newPairingRequest')).toBeInstanceOf(Function);
    });

    it('provides message dismissal', () => {
      const wrapper = shallow(<ConnectedApp store={mockStore} />).dive();
      expect(wrapper.prop('dismissAppMessage')).toBeInstanceOf(Function);
    });
  });
});
