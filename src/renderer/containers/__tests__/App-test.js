/* eslint-env jest */
import React from 'react';
import { mount, shallow } from 'enzyme';
import { StaticRouter } from 'react-router';
import { createStore } from 'redux';
import { Provider } from 'react-redux';

import { UnconnectedApp as App } from '../App';

jest.mock('../ProtocolNav');
jest.mock('../DeviceStatus');

const mockDispatched = {
  ackPairingRequest: jest.fn(),
  completedPairingRequest: jest.fn(),
  newPairingRequest: jest.fn(),
  dismissPairingRequest: jest.fn(),
  dismissAppMessages: jest.fn(),
  loadDevices: jest.fn(),
};

describe('<App />', () => {
  it('renders its routes', () => {
    const wrapper = shallow(<App {...mockDispatched} />);
    expect(wrapper.find('AppRoutes')).toHaveLength(1);
  });

  it('renders device pairing prompt when a request exists', () => {
    const mockStore = createStore(() => ({ pairingRequest: {} }));
    const wrapper = mount(
      <Provider store={mockStore}>
        <StaticRouter context={{}}>
          <App {...mockDispatched} />
        </StaticRouter>
      </Provider>);

    expect(wrapper.find('PairDevice')).toHaveLength(1);
  });

  it('registers a document drop handler to prevent default browser handling', () => {
    document.addEventListener = jest.fn();
    shallow(<App {...mockDispatched} />);
    expect(document.addEventListener).toHaveBeenCalledWith('drop', expect.any(Function));
  });
});
