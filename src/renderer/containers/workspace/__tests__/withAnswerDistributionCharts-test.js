/* eslint-env jest */
import React from 'react';
import { mount, shallow } from 'enzyme';
import { createStore } from 'redux';

import withAnswerDistributionCharts from '../withAnswerDistributionCharts';
import AdminApiClient from '../../../utils/adminApiClient';
import { mockProtocol } from '../../../../../config/jest/setupTestEnv';

jest.mock('../../../utils/adminApiClient', () => {
  function MockApiClient() {}
  MockApiClient.prototype.post = jest.fn().mockResolvedValue({
    buckets: {
      nodes: { person: { distributionVariable: { 1: 4, 2: 5 } } },
      edges: { friend: { catVariable: { 1: 3 } } },
      ego: { ordVariable: { 1: 2 } },
    },
  });
  return MockApiClient;
});

jest.mock('../../../ducks/modules/protocols', () => ({
  selectors: {
    currentProtocol: jest.fn(),
    currentProtocolId: jest.fn().mockReturnValue('1'),
    isDistributionVariable: jest.fn().mockReturnValue(true),
    transposedCodebook: jest.fn().mockReturnValue({
      node: {
        person: {
          variables: {
            distributionVariable: {
              name: '',
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
      edge: {
        friend: {
          variables: {
            catVariable: {
              name: '',
              type: 'categorical',
              options: [
                { label: 'a', value: 1 },
                { label: 'b', value: 2 },
                { label: 'c', value: 3 },
              ],
            },
          },
        },
      },
      ego: {
        variables: {
          ordVariable: {
            name: '',
            type: 'ordinal',
            options: [
              { label: 'a', value: 1 },
              { label: 'b', value: 2 },
              { label: 'c', value: 3 },
            ],
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
    expect(mockApiClient.post).toHaveBeenCalled();
  });

  it('loads data from API when totalSessionsCount changes', () => {
    wrapper.setProps({ totalSessionsCount: 1 });
    mockApiClient.post.mockClear();
    expect(mockApiClient.post).toHaveBeenCalledTimes(0);
    wrapper.setProps({ totalSessionsCount: 2 });
    expect(mockApiClient.post).toHaveBeenCalledTimes(1);
  });

  it('loads data when protocolId changes', () => {
    // shallow to bypass mapStateToProps
    const wrapped = shallow(<Wrapper store={createStore(() => state)} />).dive().dive();
    wrapped.setProps({ protocolId: null });
    mockApiClient.post.mockClear();
    wrapped.setProps({ protocolId: '2' });
    expect(mockApiClient.post).toHaveBeenCalled();
  });

  describe('API handler', () => {
    beforeEach(async () => {
      wrapper = shallow(<Wrapper store={createStore(() => state)} />).dive().dive();
      await wrapper.instance().loadData();
    });

    it('renders one chart per variable', () => {
      expect(wrapper.state('charts')).toHaveLength(3);
    });

    it('sets correct data format', async () => {
      const nodeChart = wrapper.state('charts')[0];
      const edgeChart = wrapper.state('charts')[1];
      const egoChart = wrapper.state('charts')[2];
      expect(nodeChart.chartData).toContainEqual({ name: 'a', value: 4 });
      expect(nodeChart.chartData).toContainEqual({ name: 'b', value: 5 });
      expect(edgeChart.chartData).toContainEqual({ name: 'a', value: 3 });
      expect(egoChart.chartData).toContainEqual({ name: 'a', value: 2 });
    });

    it('sets zeros for missing values', async () => {
      expect(wrapper.state('charts')[0].chartData).toContainEqual({ name: 'c', value: 0 });
      expect(wrapper.state('charts')[1].chartData).toContainEqual({ name: 'c', value: 0 });
      expect(wrapper.state('charts')[1].chartData).toContainEqual({ name: 'b', value: 0 });
      expect(wrapper.state('charts')[2].chartData).toContainEqual({ name: 'c', value: 0 });
      expect(wrapper.state('charts')[2].chartData).toContainEqual({ name: 'b', value: 0 });
    });
  });
});
