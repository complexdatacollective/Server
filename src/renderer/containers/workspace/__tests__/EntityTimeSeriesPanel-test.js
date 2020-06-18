/* eslint-env jest */
import React from 'react';
import { mount } from 'enzyme';

import EntityTimeSeriesPanel from '../EntityTimeSeriesPanel';
import AdminApiClient from '../../../utils/adminApiClient';

jest.mock('recharts');
jest.mock('../../../utils/adminApiClient', () => {
  function MockApiClient() {}
  MockApiClient.prototype.get = jest.fn().mockResolvedValue({
    entities: [{ time: 1546455484765, node: 20, edge: 0 }],
  });
  return MockApiClient;
});

const props = {
  protocolId: '1',
};

describe('ProtocolCountsPanel', () => {
  let subject;
  let mockApiClient;

  beforeEach(() => {
    mockApiClient = new AdminApiClient();
    subject = mount(<EntityTimeSeriesPanel {...props} />);
  });

  it('renders a dashboard panel', () => {
    expect(subject.find('.dashboard__panel')).toHaveLength(1);
  });

  it('loads data from API on mount', () => {
    expect(mockApiClient.get).toHaveBeenCalled();
  });

  it('loads data from API when sessionCount changes', () => {
    subject.setProps({ sessionCount: 1 });
    mockApiClient.get.mockClear();
    subject.setProps({ sessionCount: 2 });
    expect(mockApiClient.get).toHaveBeenCalledTimes(1);
  });
});
