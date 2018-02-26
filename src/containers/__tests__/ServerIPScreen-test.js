/* eslint-env jest */

import React from 'react';
import { shallow } from 'enzyme';
import ServerIPScreen from '../ServerIPScreen';

describe('<ServerIPScreen />', () => {
  it('should render', () => {
    const subject = shallow((
      <ServerIPScreen />
    ));

    expect(subject).toMatchSnapshot();
  });
});
