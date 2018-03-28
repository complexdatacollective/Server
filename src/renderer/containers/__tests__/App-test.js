/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';

import { UnconnectedApp as App } from '../App';

const mockDispatch = {
  ackPairingRequest: jest.fn(),
  completedPairingRequest: jest.fn(),
  newPairingRequest: jest.fn(),
  dismissPairingRequest: jest.fn(),
};

describe('<App />', () => {
  fit('renders its routes', () => {
    const wrapper = shallow(<App {...mockDispatch} />);
    expect(wrapper.find('AppRoutes')).toHaveLength(1);
  });
});
