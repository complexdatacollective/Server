/* eslint-env jest */

import React from 'react';
import { shallow } from 'enzyme';
import ExportScreen from '../ExportScreen';

describe('<ExportScreen />', () => {
  it('should render an export button', () => {
    const subject = shallow((
      <ExportScreen />
    ));

    expect(subject.find('button')).toHaveLength(1);
    expect(subject.find('button').text()).toMatch(/export/i);
  });
});
