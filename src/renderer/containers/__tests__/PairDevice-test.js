/* eslint-disable react/jsx-props-no-spreading */
/* eslint-env jest */
import React from 'react';
import { createStore } from 'redux';
import { shallow } from 'enzyme';

import ConnectedPairDevice, { UnconnectedPairDevice as PairDevice } from '../PairDevice';
import { PairingStatus } from '../../ducks/modules/pairingRequest';

const mockPin = '1a';

const makeProps = (status) => ({
  apiClient: {
    checkPairingCodeExpired: jest.fn().mockResolvedValue({}),
  },
  dismissPairingRequest: jest.fn(),
  addToast: jest.fn(),
  removeToast: jest.fn(),
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

  it('checks for updates', () => {
    jest.useFakeTimers();
    const props = { ...makeProps(PairingStatus.Acknowledged) };
    const subject = shallow(<PairDevice {...props} />);
    subject.setProps({ update: true });
    jest.runAllTimers();
    expect(props.apiClient.checkPairingCodeExpired).toHaveBeenCalled();
  });

  describe('Connected', () => {
    const state = {
      pairingRequest: { id: '123456' },
    };
    let store;
    beforeEach(() => {
      store = createStore(() => state);
    });

    it('maps dispatched dismiss function', () => {
      const subject = shallow(<ConnectedPairDevice store={store} />).dive();
      expect(subject.prop('dismissPairingRequest')).toBeInstanceOf(Function);
    });

    it('maps pairingRequest to props', () => {
      const subject = shallow(<ConnectedPairDevice store={store} />).dive();
      expect(subject.prop('pairingRequest')).toEqual(state.pairingRequest);
    });
  });
});
