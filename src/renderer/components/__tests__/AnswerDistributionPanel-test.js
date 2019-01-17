/* eslint-env jest */
import React from 'react';
import { mount } from 'enzyme';
import AnswerDistributionPanel from '../AnswerDistributionPanel';

jest.mock('recharts');

describe('AnswerDistributionPanel', () => {
  let chartData;
  let props;
  let subject;
  let variableType;

  beforeAll(() => {
    chartData = [];
    variableType = 'categorical';
  });

  beforeEach(() => {
    props = {
      chartData,
      variableDefinition: {
        label: '',
        name: 'distributionVariable',
        type: variableType,
        options: [
          { label: 'a', value: 1 },
          { label: 'b', value: 2 },
          { label: 'c', value: 3 },
        ],
      },
    };
    subject = mount(<AnswerDistributionPanel {...props} />);
  });

  it('renders an empty view before data loads', () => {
    expect(subject.find('BarChart')).toHaveLength(0);
    expect(subject.find('PieChart')).toHaveLength(0);
    expect(subject.find('.dashboard__emptyData')).toHaveLength(1);
  });

  describe('for ordinal variables', () => {
    beforeAll(() => {
      chartData = [{ name: '1', value: 4 }, { name: '2', value: 5 }];
      variableType = 'ordinal';
    });

    it('renders a bar chart', () => {
      expect(subject.find('BarChart')).toHaveLength(1);
    });
  });

  describe('for categorical variables', () => {
    beforeAll(() => {
      chartData = [{ name: '1', value: [4] }, { name: '2', value: [5] }];
      variableType = 'categorical';
    });

    it('renders a pie chart', () => {
      expect(subject.find('PieChart')).toHaveLength(1);
    });
  });
});
