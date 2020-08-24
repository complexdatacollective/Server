/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';
import { createStore } from 'redux';

import ConnectedWorkspaceScreen, { UnconnectedWorkspaceScreen as WorkspaceScreen } from '../WorkspaceScreen';
import { mockProtocol } from '../../../../../config/jest/setupTestEnv';

jest.mock('electron-log');
jest.mock('../withAnswerDistributionCharts', () => c => c);
jest.mock('../withSessions', () => c => c);
jest.mock('../../../components/withApiClient', () => component => component);

describe('<WorkspaceScreen />', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow((
      <WorkspaceScreen
        match={{ params: { id: 'one' } }}
        setPanelLayoutOrder={jest.fn()}
      />
    ));
  });

  it('renders a loading state', () => {
    expect(wrapper.find('Spinner')).toHaveLength(1);
  });

  it('renders a loading state until sessions load', () => {
    wrapper.setProps({ protocol: mockProtocol });
    expect(wrapper.find('Spinner')).toHaveLength(1);
  });

  describe('with loaded sessions', () => {
    beforeEach(() => {
      wrapper.setProps({ protocol: mockProtocol, sessions: [] });
    });

    it('renders dashboard panels once loaded', () => {
      expect(wrapper.find('Spinner')).toHaveLength(0);
    });

    it('renders a sortable list of panels once loaded', () => {
      expect(wrapper.find('sortableList(Panels)')).toHaveLength(1);
    });

    it('orders panels', () => {
      const unsortedKeys = wrapper.instance().panels.map(panel => panel.key);
      const panelLayoutOrder = unsortedKeys.reverse();
      wrapper.setProps({ panelLayoutOrder });
      const sortedKeys = wrapper.instance().sortedPanels.map(panel => panel.key);
      expect(sortedKeys).toEqual(panelLayoutOrder);
    });
  });

  describe('when connected', () => {
    const panelLayoutOrders = { [mockProtocol.id]: ['a', 'b'] };
    const defaultState = { protocols: [mockProtocol], sessions: [] };
    const makeSubjectWithState = state => shallow((
      <ConnectedWorkspaceScreen
        store={createStore(() => state)}
        match={{ params: { id: mockProtocol.id } }}
      />
    ));

    it('sets protocol based on store state & URL match', () => {
      const subj = makeSubjectWithState({ ...defaultState, panelLayoutOrders });
      expect(subj.find('WorkspaceScreen').prop('protocol')).toEqual(mockProtocol);
    });

    it('sets panel layout order', () => {
      const subj = makeSubjectWithState({ ...defaultState, panelLayoutOrders });
      expect(subj.find('WorkspaceScreen').prop('panelLayoutOrder')).toEqual(['a', 'b']);
    });

    it('sets a default order if none given', () => {
      wrapper = makeSubjectWithState({ ...defaultState, panelLayoutOrders: {} });
      expect(wrapper.find('WorkspaceScreen').prop('panelLayoutOrder')).toEqual([]);
    });

    it('provides setPanelLayoutOrder', () => {
      const subj = makeSubjectWithState({ ...defaultState, panelLayoutOrders });
      expect(subj.find('WorkspaceScreen').prop('setPanelLayoutOrder')).toBeInstanceOf(Function);
    });
  });
});
