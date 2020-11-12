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
    expect(wrapper.find('DeviceCard')).toHaveLength(1);
  });
});
