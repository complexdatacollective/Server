/* eslint-env jest */

import React from 'react';
import { shallow } from 'enzyme';
import ServerSetupScreen from '../ServerSetupScreen';

describe('<ServerSetupScreen />', () => {
  it('should render', () => {
    const subject = shallow((
      <ServerSetupScreen />
    ));

    expect(subject).toMatchSnapshot();
  });
});
