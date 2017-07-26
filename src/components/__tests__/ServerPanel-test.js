/* eslint-env jest */

import React from 'react';
import { shallow } from 'enzyme';
import ServerPanel from '../ServerPanel';

const mockServerOverview = {
  ip: 'x.x.x.x',
  clients: 0,
  uptime: 0,
  publicKey: '',
};

describe('<ServerPanel />', () => {
  it('should render', () => {
    const subject = shallow((
      <ServerPanel serverOverview={mockServerOverview} />
    ));

    expect(subject).toMatchSnapshot();
  });
});
