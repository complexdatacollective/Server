/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';

import GetStarted from '../GetStarted';

jest.mock('../../containers/DeviceStatus');

describe('GetStarted', () => {
  it('renders instructions', () => {
    const subject = shallow(<GetStarted />);
    expect(subject.find('Instructions')).toHaveLength(1);
  });
});
