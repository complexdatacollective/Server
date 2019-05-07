/* eslint-env jest */
import React from 'react';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import { mount } from 'enzyme';

import DeviceList from '../DeviceList';

const mockStore = createStore(() => (
  { dialogs: { dialogs: [] } }
));

describe('<DeviceList />', () => {
  const mockDevice = { id: '1', name: 'a', createdAt: new Date() };

  it('renders device details', () => {
    const wrapper = mount(
      <Provider store={mockStore}>
        <DeviceList devices={[mockDevice]} />
      </Provider>,
    );
    expect(wrapper.find('DeviceDetails')).toHaveLength(1);
  });

  it('renders instructions when no devices saved', () => {
    const wrapper = mount(<Provider store={mockStore}><DeviceList devices={[]} /></Provider>);
    expect(wrapper.find('Instructions')).toHaveLength(1);
  });

  it('renders an unpair button when needed', () => {
    const wrapper = mount(
      <Provider store={mockStore}>
        <DeviceList devices={[mockDevice]} deleteDevice={() => {}} />
      </Provider>,
    );
    const button = wrapper.find('Button');
    expect(button).toHaveLength(1);
    expect(button.text()).toMatch('Unpair');
  });
});
