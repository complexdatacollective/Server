/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';

import withSessions from '../withSessions';
import AdminApiClient from '../../utils/adminApiClient';
import { mockProtocol } from '../../../../config/jest/setupTestEnv';

jest.mock('electron-log');
jest.mock('../../utils/adminApiClient');

describe('withSessions HOC', () => {
  let Wrapper;
  let wrapper;
  let mockApiClient;

  beforeEach(() => {
    mockApiClient = new AdminApiClient();
    mockApiClient.get.mockResolvedValue({ sessions: [] });
    Wrapper = withSessions(() => null);
    wrapper = shallow(<Wrapper />);
  });

  it('loads sessions when new set imported', () => {
    wrapper.instance().loadSessions = jest.fn();
    wrapper.instance().onSessionsImported();
    expect(wrapper.instance().loadSessions).toHaveBeenCalled();
  });

  // This should pass if getDerivedStateFromProps is called
  it.skip('reloads sessions when protocol changes', () => {
    wrapper.setProps({ protocol: { id: '0', name: '0', createdAt: new Date(0) } });
    wrapper.instance().loadSessions = jest.fn();
    wrapper.setProps({ protocol: mockProtocol });
    expect(wrapper.instance().loadSessions).toHaveBeenCalled();
  });

  it('loads sessions on update when not set', () => {
    wrapper.setState({ sessions: null });
    wrapper.instance().loadSessions = jest.fn();
    wrapper.setState({ foo: 1 }); // trigger componentDidUpdate
    expect(wrapper.instance().loadSessions).toHaveBeenCalled();
  });

  it('does not reload sessions when already set', () => {
    wrapper.setState({ sessions: [{}] });
    wrapper.instance().loadSessions = jest.fn();
    wrapper.setState({ foo: 1 }); // trigger componentDidUpdate
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
    expect(Wrapper.getDerivedStateFromProps(props, state)).toMatchObject({
      sessions: null,
    });
  });

  it('retains state when protocol is same', () => {
    const state = { prevProtocolId: 1 };
    const props = { protocol: { id: 2 } };
    expect(Wrapper.getDerivedStateFromProps(state, props)).toBe(null);
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
});
