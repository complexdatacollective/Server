/* eslint-env jest */
import React from 'react';
import { mount } from 'enzyme';

import ProtocolCountsPanel from '../ProtocolCountsPanel';
import AdminApiClient from '../../utils/adminApiClient';

jest.mock('../../utils/adminApiClient');

describe('ProtocolCountsPanel', () => {
  let subject;
  let mockApiClient;

  it('renders a dashboard panel', () => {
    subject = mount(<ProtocolCountsPanel />);
    expect(subject.find('.dashboard__panel')).toHaveLength(1);
  });

  it('renders counts in a widget', () => {
    subject = mount(<ProtocolCountsPanel />);
    expect(subject.find('CountsWidget')).toHaveLength(1);
  });

  describe('api client', () => {
    beforeEach(() => {
      subject = mount(<ProtocolCountsPanel />);
      mockApiClient = new AdminApiClient();
    });

    it('loads data from API on mount', () => {
      expect(mockApiClient.get).toHaveBeenCalled();
    });

    it('loads data from API when sessionCount changes', () => {
      mockApiClient.get.mockClear();
      expect(mockApiClient.get).toHaveBeenCalledTimes(0);
      subject.setProps({ sessionCount: 45 });
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
    });
  });
});
