/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';
import { createStore } from 'redux';

import ConnectedWorkspaceScreen, { UnconnectedWorkspaceScreen as WorkspaceScreen } from '../WorkspaceScreen';
import AdminApiClient from '../../utils/adminApiClient';
import { mockProtocol } from '../../../../config/jest/setupTestEnv';

jest.mock('electron-log');
jest.mock('../AnswerDistributionPanels');
jest.mock('../../utils/adminApiClient');
jest.mock('../../components/withApiClient', () => component => component);

describe('<WorkspaceScreen />', () => {
  let wrapper;
  let mockApiClient;

  beforeEach(() => {
    mockApiClient = new AdminApiClient();
    mockApiClient.get.mockResolvedValue({ sessions: [] });
    wrapper = shallow((
      <WorkspaceScreen
        apiClient={mockApiClient}
        match={{ params: { id: 1 } }}
        transposedRegistry={{ node: {} }}
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

  it('renders dashboard panels once loaded', () => {
    wrapper.setProps({ protocol: mockProtocol });
    wrapper.setState({ sessions: [] });
    expect(wrapper.find('Spinner')).toHaveLength(0);
    expect(wrapper.find('.dashboard__panel').length).toBeGreaterThan(0);
  });

  it('loads sessions when new set imported', () => {
    wrapper.instance().loadSessions = jest.fn();
    wrapper.instance().onSessionsImported();
    expect(wrapper.instance().loadSessions).toHaveBeenCalled();
  });

  it('reloads sessions when protocol changes', () => {
    wrapper.instance().loadSessions = jest.fn();
    wrapper.setProps({ protocol: mockProtocol });
    expect(wrapper.instance().loadSessions).toHaveBeenCalled();
  });

  it('does not reload sessions when already set', () => {
    wrapper.instance().loadSessions = jest.fn();
    wrapper.setState({ sessions: [{}] });
    wrapper.setProps({ protocol: mockProtocol });
    expect(wrapper.instance().loadSessions).not.toHaveBeenCalled();
  });

  it('clears sessions if load errors', (done) => {
    mockApiClient.get.mockRejectedValue('err');
    wrapper.setProps({ protocol: mockProtocol, sessions: [{ id: 1 }] });
    // setImmediate: allow the load promise from setting protocol to flush
    setImmediate(() => {
      expect(wrapper.state()).toMatchObject({ sessions: [] });
      done();
    });
  });

  it('unsets sessions when protocol changes', () => {
    const state = { prevProtocolId: 1 };
    const props = { protocol: { id: 2 } };
    expect(WorkspaceScreen.getDerivedStateFromProps(props, state)).toMatchObject({
      sessions: null,
    });
  });

  it('retains state when protocol is same', () => {
    const state = { prevProtocolId: 1 };
    const props = { protocol: { id: 2 } };
    expect(WorkspaceScreen.getDerivedStateFromProps(state, props)).toBe(null);
  });

  it('deletes one session', () => {
    wrapper.setProps({ protocol: mockProtocol });
    wrapper.instance().deleteSession(4);
    expect(mockApiClient.delete).toHaveBeenCalledWith(wrapper.instance().sessionEndpoint(4));
  });

  it('deletes all sessions', () => {
    wrapper.setProps({ protocol: mockProtocol });
    wrapper.instance().deleteAllSessions();
    expect(mockApiClient.delete).toHaveBeenCalledWith(wrapper.instance().sessionsEndpoint);
  });

  it('cancels pending request when unmounted', () => {
    const instance = wrapper.instance();
    instance.loadPromise = {};
    wrapper.unmount();
    expect(instance.loadPromise.cancelled).toBe(true);
  });

  it('ignores cancellation when nothing outstanding', () => {
    const instance = wrapper.instance();
    instance.loadPromise = null;
    expect(() => wrapper.unmount()).not.toThrow();
  });

  describe('with a distribution variable', () => {
    const protocol = {
      ...mockProtocol,
      variableRegistry: {
        node: {
          person: {
            name: 'person',
            variables: {},
          },
        },
      },
    };

    it('renders a distribution panel if an ordinal is available', () => {
      protocol.variableRegistry.node.person.variables = {
        ord: { label: 'ord', name: 'ord', type: 'ordinal' },
      };
      wrapper.setState({ sessions: [{}] });
      wrapper.setProps({ protocol });
      const panel = wrapper.find('AnswerDistributionPanels');
      expect(panel).toHaveLength(1);
    });

    it('renders a distribution panel if a categorical is available', () => {
      protocol.variableRegistry.node.person.variables = {
        cat: { label: 'cat', name: 'cat', type: 'categorical' },
      };
      wrapper.setState({ sessions: [{}] });
      wrapper.setProps({ protocol });
      const panel = wrapper.find('AnswerDistributionPanels');
      expect(panel).toHaveLength(1);
    });

    it('sets sessionCount to drive updates', () => {
      wrapper.setState({ sessions: [{}, {}], totalSessionsCount: 2 });
      wrapper.setProps({ protocol });
      expect(wrapper.find('AnswerDistributionPanels').prop('sessionCount')).toEqual(2);
    });
  });

  describe('when connected', () => {
    it('sets protocol based on store state & URL match', () => {
      const mockStore = createStore(() => (
        { protocols: [mockProtocol] }
      ));
      const subj = shallow((
        <ConnectedWorkspaceScreen
          apiClient={mockApiClient}
          store={mockStore}
          match={{ params: { id: mockProtocol.id } }}
        />
      ));
      expect(subj.prop('protocol')).toEqual(mockProtocol);
    });
  });
});
