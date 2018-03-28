/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';

import { UnconnectedApp as App } from '../App';

const mockDispatched = {
  ackPairingRequest: jest.fn(),
  completedPairingRequest: jest.fn(),
  newPairingRequest: jest.fn(),
  dismissPairingRequest: jest.fn(),
  dismissAppMessages: jest.fn(),
};

describe('<App />', () => {
  fit('renders its routes', () => {
    const wrapper = shallow(<App {...mockDispatched} />);
    expect(wrapper.find('AppRoutes')).toHaveLength(1);
  });
});
