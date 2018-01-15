/* eslint-env jest */

import React from 'react';
import { shallow } from 'enzyme';
import ProtocolSelectScreen from '../ProtocolSelectScreen';

describe('<ProtocolSelectScreen />', () => {
  it('should render', () => {
    const subject = shallow((
      <ProtocolSelectScreen />
    ));

    expect(subject).toMatchSnapshot();
  });
});
