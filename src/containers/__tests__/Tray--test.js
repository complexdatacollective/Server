/* eslint-env jest */

import React from 'react';
import { shallow } from 'enzyme';
import Tray from '../Tray';

describe('<Tray />', () => {
  it('It should render', () => {
    const subject = shallow(<Tray />);

    expect(subject).toMatchSnapshot();
  });

  it('It should call IPC');
});
