/* eslint-env jest */

import React from 'react';
import { shallow } from 'enzyme';
import { UnconnectedOverviewScreen as OverviewScreen } from '../OverviewScreen';

describe('<OverviewScreen />', () => {
  const loadDevices = jest.fn();

  it('renders nothing while loading', () => {
    const subject = shallow(<OverviewScreen loadDevices={loadDevices} />);
    expect(subject.find('GetStarted')).toHaveLength(0);
  });

  it('renders "get started" info when empty data loaded', () => {
    const props = { loadDevices, devices: [], protocols: [] };
    const subject = shallow(<OverviewScreen {...props} />);
    expect(subject.find('GetStarted')).toHaveLength(1);
  });

  it('loads devices on startup', () => {
    shallow(<OverviewScreen loadDevices={loadDevices} />);
    expect(loadDevices).toHaveBeenCalled();
  });

  it('redirects to a protocol after startup', () => {
    const mockProtocol = { id: 'abc123', name: '1', createdAt: new Date(), updatedAt: new Date() };
    const subject = shallow((
      <OverviewScreen loadDevices={loadDevices} protocols={[mockProtocol]} />
    ));
    expect(subject.find('GetStarted')).toHaveLength(0);
    expect(subject.find('Redirect')).toHaveLength(1);
    expect(subject.find('Redirect').prop('to')).toMatch(mockProtocol.id);
  });
});
