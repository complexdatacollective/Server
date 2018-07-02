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

  it('renders instructions if no devices paired', () => {
    const wrapper = shallow(<Workspace protocol={mockProtocol} devices={[]} />);
    expect(wrapper.find('Instructions')).toHaveLength(1);
  });

  it('renders devices in a dashboard', () => {
    const device = { id: '1', name: 'd', createdAt: new Date() };
    const wrapper = shallow(<Workspace protocol={mockProtocol} devices={[device]} />);
    expect(wrapper.find('DummyDashboardFragment')).toHaveLength(1);
  });
});
