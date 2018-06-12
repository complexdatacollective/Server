/* eslint-env jest */

import React from 'react';
import { mount, shallow } from 'enzyme';
import { UnconnectedSessionPanel as SessionPanel } from '../SessionPanel';

const mockSessions = [];
const protocolId = '1';

const mockApiClient = {
  get: jest.fn().mockResolvedValue({ sessions: mockSessions }),
};

describe('<SessionPanel />', () => {
  it('renders', () => {
    const subject = mount(<SessionPanel protocolId={protocolId} />);
    expect(subject.text()).toMatch('Sessions');
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
      subject.setProps({ protocolId: '2' });
      expect(apiClient.get).toHaveBeenCalledTimes(2);
    });
  });
});
