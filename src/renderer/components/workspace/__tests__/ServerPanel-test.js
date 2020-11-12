/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';

import { UnwrappedServerPanel as ServerPanel } from '../ServerPanel';

describe('<ServerPanel />', () => {
  it('renders panel items', () => {
    const serverPanel = shallow(<ServerPanel />);
    expect(serverPanel.find('NetworkStatus').length).toBe(1);
    expect(serverPanel.find('Connect(withRouter(DeviceStatus))').length).toBe(1);
  });
});
