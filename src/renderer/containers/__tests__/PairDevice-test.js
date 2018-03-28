/* eslint-env jest */

import React from 'react';
import { shallow } from 'enzyme';

import { PairDevice } from '../PairDevice';
import { PairingStatus } from '../../ducks/modules/pairingRequest';

const makeProps = status => ({
  dismissPairingRequest: () => {},
  pairingRequest: {
    pairingCode: '1a',
    status,
  },
});

describe('<PairDevice />', () => {
  it('should not render a PIN until acknowledged', () => {
    const subject = shallow(<PairDevice {...makeProps(PairingStatus.Pending)} />);
    expect(subject.find('PairPin')).toHaveLength(0);
  });

  it('should render a PIN prompt once acknowledged', () => {
    const subject = shallow(<PairDevice {...makeProps(PairingStatus.Acknowledged)} />);
    expect(subject.find('PairPin')).toHaveLength(1);
  });

  it('should render in a Modal', () => {
    const subject = shallow(<PairDevice {...makeProps(PairingStatus.Acknowledged)} />);
    expect(subject.find('Modal')).toHaveLength(1);
  });

  it('render a completion message', () => {
    const subject = shallow(<PairDevice {...makeProps(PairingStatus.Complete)} />);
    expect(subject.find('p').text()).toMatch(/device is now paired/);
  });
});
