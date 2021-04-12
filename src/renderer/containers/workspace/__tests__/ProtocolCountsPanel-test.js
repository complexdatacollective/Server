/* eslint-disable react/jsx-props-no-spreading */
/* eslint-env jest */
import React from 'react';
import { mount, shallow } from 'enzyme';

import ConnectedProtocolCountsPanel, { UnconnectedProtocolCountsPanel } from '../ProtocolCountsPanel';
import AdminApiClient from '../../../utils/adminApiClient';

jest.mock('../../../utils/adminApiClient');

const props = {
  protocolId: '1',
};

describe('ProtocolCountsPanel', () => {
  let subject;
  let mockApiClient;

  beforeEach(() => {
    mockApiClient = new AdminApiClient();
  });

  it('renders a dashboard panel', () => {
    subject = shallow(<UnconnectedProtocolCountsPanel {...props} apiClient={mockApiClient} />);
    expect(subject.find('.dashboard__panel')).toHaveLength(1);
  });

  it('renders counts in a widget', () => {
    subject = shallow(<UnconnectedProtocolCountsPanel {...props} apiClient={mockApiClient} />);
    expect(subject.find('CountsWidget')).toHaveLength(1);
  });

  it('displays totals and averages', async () => {
    mockApiClient.get.mockResolvedValueOnce({ counts: { sessions: 2, nodes: 15, edges: 13 } });
    subject = await mount(<UnconnectedProtocolCountsPanel {...props} apiClient={mockApiClient} />);
    subject.update();
    const text = subject.find('CountsWidget').text();
    expect(text).toMatch(/Total Nodes: 15/);
    expect(text).toMatch(/Total Edges: 13/);
  });

  describe('api client', () => {
    beforeEach(() => {
      subject = mount(<ConnectedProtocolCountsPanel {...props} />);
    });

    it('loads data from API on mount', () => {
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
