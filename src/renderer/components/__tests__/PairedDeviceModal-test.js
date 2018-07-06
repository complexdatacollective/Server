/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';

import PairedDeviceModal from '../PairedDeviceModal';

describe('<PairedDeviceModal />', () => {
  it('renders a list of devices', () => {
    const subject = shallow(<PairedDeviceModal devices={[]} />);
    expect(subject.find('DeviceList')).toHaveLength(1);
  });

  it('calls a complete handler when done', () => {
    const handler = jest.fn();
    shallow(<PairedDeviceModal onComplete={handler} />).find('Modal').prop('onComplete')();
    expect(handler).toHaveBeenCalled();
  });

  it('allows an empty handler', () => {
    const modal = shallow(<PairedDeviceModal />).find('Modal');
    expect(modal.prop('onComplete')).not.toThrow();
  });
});
