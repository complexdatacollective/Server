/* eslint-env jest */
import React from 'react';
import { mount, shallow } from 'enzyme';
import OrdinalHistogramPanel from '../OrdinalHistogramPanel';

import AdminApiClient from '../../utils/adminApiClient';

jest.mock('recharts');
jest.mock('../../utils/adminApiClient', () => {
  function MockApiClient() {}
  MockApiClient.prototype.get = jest.fn().mockResolvedValue({ buckets: { 1: 4, 2: 5 } });
  return MockApiClient;
});

describe('OrdinalHistogramPanel', () => {
  let props;
  let subject;
  let mockApiClient;

  beforeEach(() => {
    props = {
      protocolId: '1',
      entityType: 'person',
      entityName: 'node',
      variableDefinition: {
        label: '',
        name: '',
        options: [
          { label: 'a', value: 1 },
          { label: 'b', value: 2 },
          { label: 'c', value: 3 },
        ],
      },
    };
    mockApiClient = new AdminApiClient();
    subject = mount(<OrdinalHistogramPanel {...props} />);
  });

  it('loads data', () => {
    expect(mockApiClient.get).toHaveBeenCalled();
  });

  it('loads data from API when sessionCount changes', () => {
    subject.setProps({ sessionCount: 1 });
    mockApiClient.get.mockClear();
    expect(mockApiClient.get).toHaveBeenCalledTimes(0);
    subject.setProps({ sessionCount: 2 });
    expect(mockApiClient.get).toHaveBeenCalledTimes(1);
  });

  it('renders a bar chart', () => {
    expect(subject.find('BarChart')).toHaveLength(1);
  });

  describe('API handler', () => {
    beforeEach(async () => {
      subject = shallow(<OrdinalHistogramPanel {...props} />).dive();
      await subject.instance().loadData();
    });

    it('sets correct data format', async () => {
      expect(subject.state('barData')).toContainEqual({ name: 'a', value: 4 });
      expect(subject.state('barData')).toContainEqual({ name: 'b', value: 5 });
    });

    it('sets zeros for missing values', async () => {
      expect(subject.state('barData')).toContainEqual({ name: 'c', value: 0 });
    });
  });
});
