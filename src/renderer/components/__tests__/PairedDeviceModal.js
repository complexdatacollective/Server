/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';

import PairedDeviceModal from '../PairedDeviceModal';

describe('<PairedDeviceModal />', () => {
  it('renders a list of devices', () => {
    const subject = shallow(<PairedDeviceModal devices={[]} />);
    expect(subject.find('DeviceList')).toHaveLength(1);
  });
});
