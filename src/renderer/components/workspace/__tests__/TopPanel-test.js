/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';

import { UnwrappedTopPanel as TopPanel } from '../TopPanel';

describe('<TopPanel />', () => {
  it('renders panel items', () => {
    const topPanel = shallow(<TopPanel>[]</TopPanel>);
    expect(topPanel.find('NetworkStatus').length).toBe(1);
    expect(topPanel.find('Connect(withRouter(DeviceStatus))').length).toBe(1);
  });
});
