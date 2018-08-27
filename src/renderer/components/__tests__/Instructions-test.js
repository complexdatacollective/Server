/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';

import Instructions from '../Instructions';

describe('<Instructions />', () => {
  it('renders protocol import instructions by default', () => {
    const subject = shallow(<Instructions />);
    expect(subject.text()).toMatch('To import a protocol:');
  });

  it('renders device pairing instructions by default', () => {
    const subject = shallow(<Instructions />);
    expect(subject.text()).toMatch('To pair a device');
  });

  it('hides protocol instructions if instructed', () => {
    const subject = shallow(<Instructions showImportInstructions={false} />);
    expect(subject.text()).not.toMatch('Import a protocol');
  });

  it('hides pairing instructions if directed', () => {
    const subject = shallow(<Instructions showPairingInstructions={false} />);
    expect(subject.text()).not.toMatch('To pair a device');
  });

  it('has a compact variant', () => {
    const subject = shallow(<Instructions compact />);
    expect(subject.find('.instructions').prop('className')).toMatch('--compact');
  });

  it('renders API info', () => {
    const apiInfo = { address: '192.168.x.x', httpPort: 65531 };
    const subject = shallow(<Instructions apiInfo={apiInfo} />);
    expect(subject.text()).toMatch(apiInfo.address);
    expect(subject.text()).toMatch(apiInfo.httpPort.toString());
  });
});
