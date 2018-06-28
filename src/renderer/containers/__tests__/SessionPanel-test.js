/* eslint-env jest */

import React from 'react';
import { mount, shallow } from 'enzyme';
import { ipcRenderer } from 'electron';

import { UnwrappedSessionPanel as SessionPanel } from '../SessionPanel';
import viewModelMapper from '../../utils/baseViewModelMapper';

const protocolId = '1';
const mockSessionId = 'session-1';
const mockSessions = [{ _id: mockSessionId }];

const mockApiClient = {
  get: jest.fn().mockResolvedValue({ sessions: mockSessions }),
  delete: jest.fn().mockResolvedValue({}),
};

describe('<SessionPanel />', () => {
  it('renders', () => {
    const subject = mount(<SessionPanel protocolId={protocolId} />);
    expect(subject.text()).toMatch('Sessions');
  });

  it('renders loaded sessions', () => {
    const subject = mount(<SessionPanel protocolId={protocolId} />);
    expect(subject.find('.session-panel__list').find('li')).toHaveLength(0);
    subject.setState({ sessions: mockSessions.map(viewModelMapper) });
    expect(subject.find('.session-panel__list').find('li')).toHaveLength(1);
  });

  it('renders total count if greater than loaded count', () => {
    const mockTotal = 991199;
    const subject = mount(<SessionPanel protocolId={protocolId} />);
    subject.setState({ totalCount: mockTotal, sessions: mockSessions.map(viewModelMapper) });
    expect(subject.text()).toContain(`${mockSessions.length} of ${mockTotal}`);
  });

  describe('session data', () => {
    let apiClient;
    beforeAll(() => {
      apiClient = mockApiClient;
    });
    beforeEach(() => {
      apiClient.get.mockClear();
    });

    it('loads on mount', () => {
      shallow(<SessionPanel protocolId={'1'} apiClient={mockApiClient} />);
      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith(`/protocols/${protocolId}/sessions`);
    });

    it('loads again on update', () => {
      const subject = shallow(<SessionPanel protocolId={'1'} apiClient={mockApiClient} />);
      subject.instance().loadPromise = null;
      subject.setProps({ protocolId: '2' });
      expect(apiClient.get).toHaveBeenCalledTimes(2);
    });

    it('loads again when imports available', () => {
      const subject = shallow(<SessionPanel protocolId={'1'} apiClient={mockApiClient} />);
      subject.instance().loadPromise = null;
      subject.instance().onSessionsImported();
      expect(apiClient.get).toHaveBeenCalledTimes(2);
    });

    it('removes ipc handler before unmount', () => {
      const subject = shallow(<SessionPanel protocolId={'1'} apiClient={mockApiClient} />);
      const handler = subject.instance().onSessionsImported;
      subject.unmount();
      expect(ipcRenderer.removeListener).toHaveBeenCalledWith('SESSIONS_IMPORTED', handler);
    });

    describe('deletion', () => {
      let confirmSpy;
      let subject;

      beforeEach(() => {
        mockApiClient.delete.mockClear();
        confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
        subject = shallow(<SessionPanel protocolId={protocolId} apiClient={mockApiClient} />);
      });

      afterEach(() => {
        confirmSpy.mockRestore();
      });

      it('can delete all', () => {
        subject.instance().deleteAllSessions();
        expect(apiClient.delete).toHaveBeenCalledWith(`/protocols/${protocolId}/sessions`);
      });

      it('can delete one', () => {
        subject.instance().deleteSession(mockSessionId);
        expect(apiClient.delete).toHaveBeenCalledWith(`/protocols/${protocolId}/sessions/${mockSessionId}`);
      });

      it('requires a protocolId', () => {
        const withoutProtocol = shallow(<SessionPanel apiClient={mockApiClient} />);
        withoutProtocol.instance().deleteAllSessions();
        expect(apiClient.delete).not.toHaveBeenCalled();
      });

      it('requires a sessionId to delete single session', () => {
        subject.instance().deleteSession();
        expect(apiClient.delete).not.toHaveBeenCalled();
      });

      describe('UI', () => {
        let instance;

        beforeEach(() => {
          subject = mount(<SessionPanel protocolId={protocolId} apiClient={mockApiClient} />);
          subject.setState({ isLoading: false, sessions: mockSessions.map(viewModelMapper) });
          instance = subject.instance();
          jest.spyOn(instance, 'deleteAllSessions');
          jest.spyOn(instance, 'deleteSession');
        });

        it('provides a button to delete all', () => {
          expect(instance.deleteAllSessions).not.toHaveBeenCalled();
          subject.find('.session-panel__header').find('DismissButton').simulate('click');
          expect(instance.deleteAllSessions).toHaveBeenCalled();
        });

        it('provides a button to delete one', () => {
          expect(instance.deleteSession).not.toHaveBeenCalled();
          subject.find('ul').find('DismissButton').simulate('click');
          expect(instance.deleteSession).toHaveBeenCalled();
        });
      });
    });
  });
});
