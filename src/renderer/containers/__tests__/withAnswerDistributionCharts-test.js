/* eslint-env jest */
import React from 'react';
import { mount, shallow } from 'enzyme';
import { createStore } from 'redux';

import withAnswerDistributionCharts from '../withAnswerDistributionCharts';
import AdminApiClient from '../../utils/adminApiClient';
import { mockProtocol } from '../../../../config/jest/setupTestEnv';

jest.mock('../../utils/adminApiClient', () => {
  function MockApiClient() {}
  MockApiClient.prototype.get = jest.fn().mockResolvedValue({
    buckets: { person: { distributionVariable: { 1: 4, 2: 5 } } },
  });
  return MockApiClient;
});

jest.mock('../../ducks/modules/protocols', () => ({
  selectors: {
    currentProtocol: jest.fn(),
    currentProtocolId: jest.fn().mockReturnValue('1'),
    isDistributionVariable: jest.fn().mockReturnValue(true),
    transposedRegistry: jest.fn().mockReturnValue({
      node: {
        person: {
          variables: {
            distributionVariable: {
              label: '',
              type: 'ordinal',
              options: [
                { label: 'a', value: 1 },
                { label: 'b', value: 2 },
                { label: 'c', value: 3 },
              ],
            },
          },
        },
      },
    }),
  },
}));

describe('AnswerDistributionPanels', () => {
  let state;
  let Wrapper;
  let wrapper;
  let mockApiClient;

  beforeEach(() => {
    state = { protocol: mockProtocol };
    mockApiClient = new AdminApiClient();
    Wrapper = withAnswerDistributionCharts(() => null);
    wrapper = mount(<Wrapper store={createStore(() => state)} />);
  });

  it('loads data', () => {
    expect(mockApiClient.get).toHaveBeenCalled();
  });

  it('loads data from API when totalSessionsCount changes', () => {
    wrapper.setProps({ totalSessionsCount: 1 });
    mockApiClient.get.mockClear();
    expect(mockApiClient.get).toHaveBeenCalledTimes(0);
    wrapper.setProps({ totalSessionsCount: 2 });
    expect(mockApiClient.get).toHaveBeenCalledTimes(1);
  });

  it('loads data when protocolId changes', () => {
    // shallow to bypass mapStateToProps
    const wrapped = shallow(<Wrapper store={createStore(() => state)} />).dive();
    wrapped.setProps({ protocolId: null });
    mockApiClient.get.mockClear();
    wrapped.setProps({ protocolId: '2' });
    expect(mockApiClient.get).toHaveBeenCalled();
  });

  describe('API handler', () => {
    beforeEach(async () => {
      wrapper = shallow(<Wrapper store={createStore(() => state)} />).dive();
      await wrapper.instance().loadData();
    });

    it('renders one chart per variable', () => {
      expect(wrapper.state('charts')).toHaveLength(1);
    });

    it('sets correct data format', async () => {
      const chart = wrapper.state('charts')[0];
      expect(chart.chartData).toContainEqual({ name: 'a', value: 4 });
      expect(chart.chartData).toContainEqual({ name: 'b', value: 5 });
    });

    it('sets zeros for missing values', async () => {
      expect(wrapper.state('charts')[0].chartData).toContainEqual({ name: 'c', value: 0 });
    });
  });
});
