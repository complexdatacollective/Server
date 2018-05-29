/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';
import { UnconnectedSettingsScreen as SettingsScreen } from '../SettingsScreen';

describe('<SettingsScreen />', () => {
  const loadProtocol = jest.fn();
  const mockProtocol = { id: '1', name: '1', createdAt: new Date() };
  let subject;

  beforeEach(() => {
    const match = { params: { id: mockProtocol.id } };
    subject = shallow(<SettingsScreen loadProtocol={loadProtocol} match={match} />);
  });

  it('should render', () => {
    subject.setProps({ protocol: mockProtocol });
    expect(subject.find('h1')).toHaveLength(1);
  });
});
