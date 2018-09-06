/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';

import SessionHistoryPanel from '../SessionHistoryPanel';

describe('SessionHistoryPanel', () => {
  it('renders a bar chart of sessions', () => {
    const wrapper = shallow(<SessionHistoryPanel sessions={[{ updatedAt: new Date() }]} />);
    expect(wrapper.find('BarChart')).toHaveLength(1);
  });

  it('renders no chart when sessions are empty', () => {
    const wrapper = shallow(<SessionHistoryPanel sessions={[]} />);
    expect(wrapper.find('BarChart')).toHaveLength(0);
  });
});
