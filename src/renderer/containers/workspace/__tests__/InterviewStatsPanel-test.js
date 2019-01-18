/* eslint-env jest */
import React from 'react';
import { mount, shallow } from 'enzyme';

import InterviewStatsPanel from '../InterviewStatsPanel';
import AdminApiClient from '../../../utils/adminApiClient';

jest.mock('../../../utils/adminApiClient');

describe('InterviewStatsPanel', () => {
  let mockApiClient;
  beforeEach(() => {
    mockApiClient = new AdminApiClient();
  });

  it('manages an API client instance', () => {
    const subject = shallow(<InterviewStatsPanel protocolId="1" />);
    expect(subject.prop('apiClient')).toBeInstanceOf(Object);
  });

  describe('mounted', () => {
    let subject;
    beforeEach(() => {
      subject = mount(<InterviewStatsPanel protocolId="1" />);
    });

    it('renders an interview widget', () => {
      expect(subject.find('InterviewWidget')).toHaveLength(1);
    });

    it('loads data', () => {
      mount(<InterviewStatsPanel protocolId="1" />);
      expect(mockApiClient.get).toHaveBeenCalled();
    });

    it('loads data from API when sessionCount changes', () => {
      subject.setProps({ sessionCount: 1 });
      mockApiClient.get.mockClear();
      expect(mockApiClient.get).toHaveBeenCalledTimes(0);
      subject.setProps({ sessionCount: 2 });
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
    });
  });
});
