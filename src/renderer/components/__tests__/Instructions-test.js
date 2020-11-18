/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';

import Instructions from '../Instructions';

describe('<Instructions />', () => {
  it('renders protocol import instructions by default', () => {
    const subject = shallow(<Instructions />);
    expect(subject.text()).toMatch('To create a workspace:');
  });

  it('renders device pairing instructions by default', () => {
    const subject = shallow(<Instructions />);
    expect(subject.find('PairingInstructions').dive().text()).toMatch('To pair a device');
  });

  it('hides protocol instructions if instructed', () => {
    const subject = shallow(<Instructions showImportInstructions={false} />);
    expect(subject.text()).not.toMatch('Import a protocol');
  });

  it('hides pairing instructions if directed', () => {
    const subject = shallow(<Instructions showPairingInstructions={false} />);
    expect(subject.text()).not.toMatch('To pair a device');
  });
});
