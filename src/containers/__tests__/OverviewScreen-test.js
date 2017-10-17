/* eslint-env jest */

import React from 'react';
import { shallow } from 'enzyme';
import { WebSocket } from 'mock-socket';
import OverviewScreen from '../OverviewScreen';

console.log('hi');
console.log(WebSocket);
global.WebSocket = WebSocket;


console.log(WebSocket);
describe('<OverviewScreen />', () => {
  it('should render', () => {
    const subject = shallow((
      <OverviewScreen />
    ));

    expect(subject).toMatchSnapshot();
  });
});
