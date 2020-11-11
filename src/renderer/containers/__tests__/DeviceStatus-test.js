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
    expect(subject.text()).toMatch(new RegExp(`\\b${mockDevices.length}\\b`));
  });

  it('requests devices to display', () => {
    const mockLoader = jest.fn();
    shallow(<DeviceStatus history={{}} loadDevices={mockLoader} />);
    expect(mockLoader).toHaveBeenCalledTimes(1);
  });

  it('renders an empty badge before load', () => {
    const subject = shallow(<DeviceStatus history={{}} devices={null} />);
    expect(subject.find('.device-icon__badge').text()).toEqual('');
  });

  it('renders a dark button variant', () => {
    const subject = shallow(<DeviceStatus history={{}} dark />);
    const btnClass = subject.find('button').prop('className');
    expect(btnClass).toContain('--dark');
  });

  it('Instructions modals', async () => {
    const deviceStatus = mount((
      <Provider store={store}>
        <DeviceStatus history={{}} devices={[]} />
      </Provider>
    ));

    expect(deviceStatus.find('Overlay[title="Paired Devices"]').prop('show')).toBe(false);
    expect(deviceStatus.find('Overlay[title="Pairing Instructions"]').prop('show')).toBe(false);

    await act(async () => {
      await deviceStatus.find('button[data-test="view-device-panel"]').simulate('click');
    });

    deviceStatus.update();

    expect(deviceStatus.find('Overlay[title="Paired Devices"]').prop('show')).toBe(true);
    expect(deviceStatus.find('Overlay[title="Pairing Instructions"]').prop('show')).toBe(false);

    await act(async () => {
      await deviceStatus.find('button[data-test="view-pairing-instructions"]').simulate('click');
    });

    deviceStatus.update();

    expect(deviceStatus.find('Overlay[title="Paired Devices"]').prop('show')).toBe(false);
    expect(deviceStatus.find('Overlay[title="Pairing Instructions"]').prop('show')).toBe(true);
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
