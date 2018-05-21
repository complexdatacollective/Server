/* eslint-env jest */

import React from 'react';
import { shallow } from 'enzyme';
import { UnconnectedOverviewScreen as OverviewScreen } from '../OverviewScreen';

describe('<OverviewScreen />', () => {
  it('renders startup instructions', () => {
    const subject = shallow(<OverviewScreen />);
    expect(subject.find('Instructions')).toHaveLength(1);
  });

  it('redirects to a protocol after startup', () => {
    const mockProtocol = { id: 'abc123', name: '1', createdAt: new Date(), updatedAt: new Date() };
    const subject = shallow(<OverviewScreen protocols={[mockProtocol]} />);
    expect(subject.find('Instructions')).toHaveLength(0);
    expect(subject.find('Redirect')).toHaveLength(1);
    expect(subject.find('Redirect').prop('to')).toMatch(mockProtocol.id);
  });
});
