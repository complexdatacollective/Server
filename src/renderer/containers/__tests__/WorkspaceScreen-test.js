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
  let setCurrentProtocol = jest.fn();

  beforeEach(() => {
    setCurrentProtocol = jest.fn();
    wrapper = shallow((
      <WorkspaceScreen
        setCurrentProtocol={setCurrentProtocol}
        match={{ params: { id: 1 } }}
      />
    ));
  });

  it('renders a loading state', () => {
    expect(wrapper.find('Spinner')).toHaveLength(1);
  });

  it('sets protocol on mount', () => {
    expect(setCurrentProtocol).toHaveBeenCalledTimes(1);
  });

  it('sets protocol on update when ID param changes', () => {
    wrapper.setProps({ match: { params: { id: 2 } } });
    expect(setCurrentProtocol).toHaveBeenCalledTimes(2);
  });

  it('skips update when ID does not change', () => {
    wrapper.setProps({ match: { params: { id: 1 } } });
    expect(setCurrentProtocol).toHaveBeenCalledTimes(1);
  });

  it('renders a workspace when protocol is loaded', () => {
    wrapper.setProps({ protocol: mockProtocol });
    expect(wrapper.find('Workspace')).toHaveLength(1);
  });

  describe('when connected', () => {
    it('sets protocol based on store state', () => {
      const mockStore = createStore(() => (
        { protocols: [mockProtocol], currentProtocolId: mockProtocol.id }
      ));
      const subj = shallow((
        <ConnectedWorkspaceScreen
          store={mockStore}
          match={{ params: { id: 1 } }}
        />
      ));
      expect(subj.prop('protocol')).toEqual(mockProtocol);
    });
  });
});
