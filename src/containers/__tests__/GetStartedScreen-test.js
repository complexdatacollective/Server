/* eslint-env jest */

import React from 'react';
import { shallow } from 'enzyme';
import GetStartedScreen from '../GetStartedScreen';

describe('<GetStartedScreen />', () => {
  it('should render', () => {
    const subject = shallow((
      <GetStartedScreen />
    ));

    expect(subject).toMatchSnapshot();
  });
});
