/* eslint-env jest */
import React from 'react';
import { mount, shallow } from 'enzyme';
import { StaticRouter } from 'react-router';
import { createStore } from 'redux';
import { Provider } from 'react-redux';

import { ConnectedApp, UnconnectedApp as App } from '../App';
import { isFrameless } from '../../utils/environment';

// const env = jest.genMockFromModule('../../utils/environment');

jest.mock('../ProtocolNav', () => 'mock-protocol-nav');
jest.mock('../DeviceStatus');
jest.mock('../../utils/environment');

const mockDispatched = {
  ackPairingRequest: jest.fn(),
  completedPairingRequest: jest.fn(),
  newPairingRequest: jest.fn(),
  dismissPairingRequest: jest.fn(),
  dismissAppMessages: jest.fn(),
  loadDevices: jest.fn(),
};

describe('<App />', () => {
  const mockPairRequest = {};
  const mockMsg = { timestamp: 1529338487695, text: 'ok' };
  const mockStore = createStore(() => (
    { appMessages: [mockMsg], pairingRequest: mockPairRequest }
  ));

  it('renders its routes', () => {
    const wrapper = shallow(<App {...mockDispatched} />);
    expect(wrapper.find('AppRoutes')).toHaveLength(1);
  });

  it('renders queued messages', () => {
    const wrapper = shallow(<App {...mockDispatched} appMessages={[mockMsg]} />);
    expect(wrapper.find('AppMessage')).toHaveLength(1);
  });

  it('renders device pairing prompt when a request exists', () => {
    const wrapper = mount(
      <Provider store={mockStore}>
        <StaticRouter context={{}}>
          <App {...mockDispatched} />
        </StaticRouter>
      </Provider>);

    expect(wrapper.find('PairDevice')).toHaveLength(1);
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
      app = shallow(<ConnectedApp store={mockStore} {...mockDispatched} />);
    });

    it('maps messages from state', () => {
      expect(app.prop('appMessages')).toContain(mockMsg);
    });

    it('maps messages from state', () => {
      expect(app.prop('pairingRequest')).toBe(mockPairRequest);
    });

    it('provides pairing actions', () => {
      const wrapper = shallow(<ConnectedApp store={mockStore} />);
      expect(wrapper.prop('ackPairingRequest')).toBeInstanceOf(Function);
      expect(wrapper.prop('completedPairingRequest')).toBeInstanceOf(Function);
      expect(wrapper.prop('dismissPairingRequest')).toBeInstanceOf(Function);
      expect(wrapper.prop('newPairingRequest')).toBeInstanceOf(Function);
    });

    it('provides message dismissal', () => {
      const wrapper = shallow(<ConnectedApp store={mockStore} />);
      expect(wrapper.prop('dismissAppMessages')).toBeInstanceOf(Function);
    });
  });
});
