/* eslint-env jest */
import React from 'react';
import { createStore } from 'redux';
import { shallow } from 'enzyme';

import ConnectedDeviceStatus, { UnconnectedDeviceStatus as DeviceStatus } from '../DeviceStatus';
import { PairingStatus } from '../../ducks/modules/pairingRequest';

jest.mock('../../utils/adminApiClient');

const mockDevice = { id: '1', name: '1', createdAt: new Date() };

describe('<DeviceStatus />', () => {
  const mockDevices = [mockDevice, mockDevice];

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

  it('hides the instructions modal when a pairing request arrives', () => {
    const state = { showModal: true };
    const newState = DeviceStatus.getDerivedStateFromProps({ hasPendingRequest: true }, state);
    expect(newState.showModal).toBe(false);
  });

  it('keeps the instructions modal when other props update', () => {
    const state = { showModal: true };
    const newState = DeviceStatus.getDerivedStateFromProps({ hasPendingRequest: false }, state);
    expect(newState.showModal).toBe(true);
  });

  describe('Connected', () => {
    const state = {
      devices: [{ id: 'device1', name: '1', createdAt: new Date() }],
      pairingRequest: { status: PairingStatus.Pending },
    };
    let store;
    beforeEach(() => {
      store = createStore(() => state);
    });

    it('maps a dispatched loadDevices fn to props', () => {
      const subject = shallow(<ConnectedDeviceStatus store={store} />)
        .dive();
      expect(subject.prop('loadDevices')).toBeInstanceOf(Function);
    });

    it('maps devices to props', () => {
      const subject = shallow(<ConnectedDeviceStatus store={store} />)
        .dive();
      expect(subject.prop('devices')).toEqual(state.devices);
    });

    it('maps hasPendingRequest to props', () => {
      const subject = shallow(<ConnectedDeviceStatus store={store} />)
        .dive();
      expect(subject.prop('hasPendingRequest')).toBe(true);
    });
  });
});
