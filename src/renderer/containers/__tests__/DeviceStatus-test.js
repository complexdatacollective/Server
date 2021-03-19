/* eslint-env jest */
import React from 'react';
import { act } from 'react-dom/test-utils';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import { shallow, mount } from 'enzyme';

import ConnectedDeviceStatus, { UnconnectedDeviceStatus as DeviceStatus } from '../DeviceStatus';
import { PairingStatus } from '../../ducks/modules/pairingRequest';

jest.mock('../../utils/adminApiClient', () => {
  class MockAdminApiClient {
    get = () => Promise.resolve({
      serverStatus: {
        deviceApiPort: '',
      },
    });
  }

  return MockAdminApiClient;
});

jest.mock('../../hooks/useNetworkStatus', () => () => ({
  deviceApiPort: '123.1.1',
  publicAddresses: [],
}));

const mockDevice = { id: '1', name: '1', createdAt: new Date() };

const state = {
  devices: [{ id: 'device1', name: '1', createdAt: new Date() }],
  pairingRequest: { status: PairingStatus.Pending },
};

describe('<DeviceStatus />', () => {
  let store;
  const mockDevices = [mockDevice, mockDevice];

  beforeEach(() => {
    store = createStore(() => state);
  });

  it('renders the paired device count', () => {
    const subject = shallow(<DeviceStatus history={{}} devices={mockDevices} />);
    expect(subject.find('.device-status__badge').text()).toMatch(new RegExp(`\\b${mockDevices.length}\\b`));
  });

  it('requests devices to display', async () => {
    const mockLoader = jest.fn();
    await act(async () => {
      await mount(<DeviceStatus history={{}} loadDevices={mockLoader} />);
    });
    expect(mockLoader).toHaveBeenCalledTimes(1);
  });

  it('Instructions modals behave correctly', async () => {
    const deviceStatus = mount(
      React.createElement(
        (props) => (
          <Provider store={store}>
            <DeviceStatus history={{}} devices={[]} {...props} />
          </Provider>
        ),
      ),
    );

    // They start closed
    expect(deviceStatus.find('Overlay[title="Paired Devices"]').prop('show')).toBe(false);
    expect(deviceStatus.find('Overlay[title="Pairing Instructions"]').prop('show')).toBe(false);

    // Paired devices overlay opens when the button is clicked
    await act(async () => {
      await deviceStatus.find('div[data-test="view-device-panel"]').simulate('click');
    });

    deviceStatus.update();

    expect(deviceStatus.find('Overlay[title="Paired Devices"]').prop('show')).toBe(true);
    expect(deviceStatus.find('Overlay[title="Pairing Instructions"]').prop('show')).toBe(false);

    // Instructions can be opened from the paired devices overlay
    await act(async () => {
      await deviceStatus.find('button[data-test="view-pairing-instructions"]').simulate('click');
    });

    deviceStatus.update();

    expect(deviceStatus.find('Overlay[title="Paired Devices"]').prop('show')).toBe(false);
    expect(deviceStatus.find('Overlay[title="Pairing Instructions"]').prop('show')).toBe(true);

    // If hasPendingRequest changes, overlays are closed.
    deviceStatus.setProps({ hasPendingRequest: true });
    deviceStatus.update();

    expect(deviceStatus.find('Overlay[title="Paired Devices"]').prop('show')).toBe(false);
    expect(deviceStatus.find('Overlay[title="Pairing Instructions"]').prop('show')).toBe(false);
  });

  describe('Connected', () => {
    it('maps a dispatched loadDevices fn to props', () => {
      const subject = shallow(<ConnectedDeviceStatus store={store} />).dive();
      expect(subject.prop('loadDevices')).toBeInstanceOf(Function);
    });

    it('maps devices to props', () => {
      const subject = shallow(<ConnectedDeviceStatus store={store} />).dive();
      expect(subject.prop('devices')).toEqual(state.devices);
    });

    it('maps hasPendingRequest to props', () => {
      const subject = shallow(<ConnectedDeviceStatus store={store} />).dive();
      expect(subject.prop('hasPendingRequest')).toBe(true);
    });
  });
});
