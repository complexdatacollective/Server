/* eslint-env jest */

import React from 'react';
import { shallow } from 'enzyme';
import OverviewScreen from '../OverviewScreen';

describe('<OverviewScreen />', () => {
  it('should render', () => {
    const subject = shallow((
      <OverviewScreen />
    ));

    expect(subject).toMatchSnapshot();
  });
});
