/* eslint-env jest */

import React from 'react';
import { shallow } from 'enzyme';
import ExportScreen from '../ExportScreen';

describe('<ExportScreen />', () => {
  it('should render', () => {
    const subject = shallow((
      <ExportScreen />
    ));

    expect(subject).toMatchSnapshot();
  });
});
