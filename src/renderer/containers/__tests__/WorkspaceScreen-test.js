/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';

import { UnconnectedWorkspaceScreen as WorkspaceScreen } from '../WorkspaceScreen';

const mockProtocol = {
  id: '1',
  filename: 'a.netcanvas',
  name: 'MyProtocol',
  createdAt: new Date(),
  updatedAt: new Date(),
  networkCanvasVersion: '1',
  version: '2.0',
};

describe('<WorkspaceScreen />', () => {
  let wrapper;
  let loadProtocol = jest.fn();

  beforeEach(() => {
    loadProtocol = jest.fn();
    wrapper = shallow((
      <WorkspaceScreen
        loadProtocol={loadProtocol}
        match={{ params: { id: 1 } }}
      />
    ));
  });

  it('renders a loading state', () => {
    expect(wrapper.find('Spinner')).toHaveLength(1);
  });

  it('loads a protocol on mount', () => {
    expect(loadProtocol).toHaveBeenCalledTimes(1);
  });

  it('renders a workspace when protocol is loaded', () => {
    wrapper.setProps({ protocol: mockProtocol });
    expect(wrapper.find('Workspace')).toHaveLength(1);
  });
});
