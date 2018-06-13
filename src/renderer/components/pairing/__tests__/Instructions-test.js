/* eslint-env jest */
import React from 'react';
import { mount } from 'enzyme';

import Instructions from '../Instructions';

jest.mock('../../../containers/DeviceStatus');

describe('<Instructions />', () => {
  it('renders protocol import instructions', () => {
    const subject = mount(<Instructions />);
    expect(subject.text()).toMatch('Import a protocol');
  });

  it('renders device pairing instructions', () => {
    const subject = mount(<Instructions />);
    expect(subject.text()).toMatch('Pair a device');
  });

  it('hides pairing instructions once paired', () => {
    const subject = mount(<Instructions devices={[{ id: 'a', name: 'a', createdAt: new Date() }]} />);
    expect(subject.text()).not.toMatch('Pair a device');
  });
});
