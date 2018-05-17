/* eslint-env jest */
import React from 'react';
import { mount } from 'enzyme';
import Workspace from '../Workspace';

const mockProtocol = {
  id: '1',
  filename: 'a.netcanvas',
  name: 'MyProtocol',
  createdAt: new Date(),
  updatedAt: new Date(),
  networkCanvasVersion: '1',
  version: '2.0',
};

describe('<Workspace />', () => {
  it('renders some protocol info', () => {
    const wrapper = mount(<Workspace protocol={mockProtocol} />);
    expect(wrapper.text()).toContain(mockProtocol.name);
    expect(wrapper.text()).toContain(mockProtocol.version);
  });
});
