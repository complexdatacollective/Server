/* eslint-env jest */

import React from 'react';
import { shallow } from 'enzyme';
import { UnwrappedServerPanel as ServerPanel } from '../ServerPanel';

jest.mock('../../utils/adminApiClient');

const mockServerOverview = {
  ip: 'x.x.x.x',
  clients: 0,
  uptime: 0,
  publicKey: '',
};
// setting Date.now so that it is consistent for snapshot
Date.now = jest.fn(() => 1482363367071);

describe('<ServerPanel />', () => {
  it('should render', () => {
    const serverPanel = shallow((
      <ServerPanel serverOverview={mockServerOverview} />
    ));

    expect(serverPanel).toMatchSnapshot();
  });
});
