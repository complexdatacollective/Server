/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';
import Workspace from '../Workspace';

const mockProtocol = {
  id: '1',
  filename: 'a.netcanvas',
  name: 'MyProtocol',
  createdAt: new Date(),
  updatedAt: new Date(),
  lastModified: new Date(),
  networkCanvasVersion: '1',
  version: '2.0',
};

describe('<Workspace />', () => {
  it('renders a protocol name', () => {
    const wrapper = shallow(<Workspace protocol={mockProtocol} />);
    expect(wrapper.text()).toContain(mockProtocol.name);
  });

  it('renders a dashboard', () => {
    const wrapper = shallow(<Workspace protocol={mockProtocol} />);
    expect(wrapper.find('DummyDashboardFragment')).toHaveLength(1);
  });
});
