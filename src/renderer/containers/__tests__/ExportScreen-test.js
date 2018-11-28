/* eslint-env jest */

import React from 'react';
import { shallow } from 'enzyme';
import { ExportScreen } from '../ExportScreen';

describe('<ExportScreen />', () => {
  const protocol = { id: '1', name: 'mock', createdAt: new Date(1540000000000) };

  it('should render an export button', () => {
    const subject = shallow((
      <ExportScreen protocolsHaveLoaded protocol={protocol} />
    ));

    expect(subject.find('Button')).toHaveLength(1);
    expect(subject.find('Button').html()).toMatch(/export/i);
  });
});
