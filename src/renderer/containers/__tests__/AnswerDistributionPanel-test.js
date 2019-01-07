/* eslint-env jest */
import React from 'react';
import { mount, shallow } from 'enzyme';
import AnswerDistributionPanel from '../AnswerDistributionPanel';

import AdminApiClient from '../../utils/adminApiClient';

jest.mock('recharts');
jest.mock('../../utils/adminApiClient', () => {
  function MockApiClient() {}
  MockApiClient.prototype.get = jest.fn().mockResolvedValue({
    buckets: { person: { distributionVariable: { 1: 4, 2: 5 } } },
  });
  return MockApiClient;
});

describe('AnswerDistributionPanel', () => {
  let props;
  let subject;
  let mockApiClient;
  let variableType;

  beforeAll(() => {
    variableType = 'categorical';
  });

  beforeEach(() => {
    props = {
      variableType,
      protocolId: '1',
      entityType: 'person',
      entityName: 'node',
      variableDefinition: {
        label: '',
        name: 'distributionVariable',
        options: [
          { label: 'a', value: 1 },
          { label: 'b', value: 2 },
          { label: 'c', value: 3 },
        ],
      },
    };
    mockApiClient = new AdminApiClient();
    subject = mount(<AnswerDistributionPanel {...props} />);
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

  it('renders an empty view before data loads', () => {
    expect(subject.find('BarChart')).toHaveLength(0);
    expect(subject.find('PieChart')).toHaveLength(0);
    expect(subject.find('.dashboard__emptyData')).toHaveLength(1);
  });

  describe('for ordinal variables', () => {
    beforeAll(() => {
      variableType = 'ordinal';
    });

    it('renders a bar chart', () => {
      subject.mount(); // wait for loaded data
      expect(subject.find('BarChart')).toHaveLength(1);
    });
  });

  describe('for categorical variables', () => {
    beforeAll(() => {
      variableType = 'categorical';
    });

    it('renders a pie chart', () => {
      subject.mount(); // wait for loaded data
      expect(subject.find('PieChart')).toHaveLength(1);
    });
  });

  describe('API handler', () => {
    beforeEach(async () => {
      subject = shallow(<AnswerDistributionPanel {...props} />).dive();
      await subject.instance().loadData();
    });

    it('sets correct data format', async () => {
      expect(subject.state('chartData')).toContainEqual({ name: 'a', value: 4 });
      expect(subject.state('chartData')).toContainEqual({ name: 'b', value: 5 });
    });

    it('sets zeros for missing values', async () => {
      expect(subject.state('chartData')).toContainEqual({ name: 'c', value: 0 });
    });
  });
});
