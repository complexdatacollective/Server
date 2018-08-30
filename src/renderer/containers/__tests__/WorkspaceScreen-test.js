/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';
import { createStore } from 'redux';

import ConnectedWorkspaceScreen, { UnconnectedWorkspaceScreen as WorkspaceScreen } from '../WorkspaceScreen';
import AdminApiClient from '../../utils/adminApiClient';
import { mockProtocol } from '../../../../config/jest/setupTestEnv';

jest.mock('../../utils/adminApiClient');

describe('<WorkspaceScreen />', () => {
  let wrapper;

  beforeEach(() => {
    const mockApiClient = new AdminApiClient();
    mockApiClient.get.mockResolvedValue({ sessions: [] });
    wrapper = shallow((
      <WorkspaceScreen
        apiClient={mockApiClient}
        match={{ params: { id: 1 } }}
      />
    ));
  });

  it('renders a loading state', () => {
    expect(wrapper.find('Spinner')).toHaveLength(1);
  });

  it('renders dashboard panels', () => {
    wrapper.setProps({ protocol: mockProtocol });
    expect(wrapper.find('.dashboard__panel').length).toBeGreaterThan(0);
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
