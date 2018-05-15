/* eslint-env jest */

import React from 'react';
import { shallow } from 'enzyme';

import { UnconnectedPairDevice as PairDevice } from '../PairDevice';
import { PairingStatus } from '../../ducks/modules/pairingRequest';

const mockPin = '1a';

const makeProps = status => ({
  dismissPairingRequest: () => {},
  pairingRequest: {
    pairingCode: status ? mockPin : null,
    status,
  },
});

describe('<PairDevice />', () => {
  it('renders a placeholder PIN prompt before code available', () => {
    const subject = shallow(<PairDevice {...makeProps(null)} />);
    const pairPin = subject.find('PairPin');
    expect(pairPin).toHaveLength(1);
    expect(pairPin.prop('code')).toBeNull();
  });

  it('should render a PIN prompt once acknowledged', () => {
    const subject = shallow(<PairDevice {...makeProps(PairingStatus.Acknowledged)} />);
    expect(subject.find('PairPin').prop('code')).toEqual(mockPin);
  });

  it('should render in a Modal', () => {
    const subject = shallow(<PairDevice {...makeProps(PairingStatus.Acknowledged)} />);
    expect(subject.find('Modal.modal--pairing-confirmation')).toHaveLength(1);
  });

  it('render a completion message', () => {
    const subject = shallow(<PairDevice {...makeProps(PairingStatus.Complete)} />);
    expect(subject.find('p').text()).toMatch(/device is now paired/);
  });
});
