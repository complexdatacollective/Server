/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';
import { createStore } from 'redux';

import ConnectedWorkspaceScreen, { UnconnectedWorkspaceScreen as WorkspaceScreen } from '../WorkspaceScreen';

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

  beforeEach(() => {
    wrapper = shallow((
      <WorkspaceScreen
        match={{ params: { id: 1 } }}
      />
    ));
  });

  it('renders a loading state', () => {
    expect(wrapper.find('Spinner')).toHaveLength(1);
  });

  it('renders a workspace when protocol is loaded', () => {
    wrapper.setProps({ protocol: mockProtocol });
    expect(wrapper.find('Workspace')).toHaveLength(1);
  });

  describe('when connected', () => {
    it('sets protocol based on store state & URL match', () => {
      const mockStore = createStore(() => (
        { protocols: [mockProtocol] }
      ));
      const subj = shallow((
        <ConnectedWorkspaceScreen
          store={mockStore}
          match={{ params: { id: mockProtocol.id } }}
        />
      ));
      expect(subj.prop('protocol')).toEqual(mockProtocol);
    });
  });
});
