/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';
import { createStore } from 'redux';

import ConnectedSettingsScreen, { UnconnectedSettingsScreen as SettingsScreen } from '../SettingsScreen';

describe('<SettingsScreen />', () => {
  const setCurrentProtocol = jest.fn();
  const mockProtocol = { id: '1', name: '1', createdAt: new Date() };
  let subject;

  beforeEach(() => {
    const match = { params: { id: mockProtocol.id } };
    subject = shallow(<SettingsScreen setCurrentProtocol={setCurrentProtocol} match={match} />);
  });

  it('should render', () => {
    subject.setProps({ protocol: mockProtocol });
    expect(subject.find('h1')).toHaveLength(1);
  });

  describe('when connected', () => {
    it('sets protocol based on store state', () => {
      const mockStore = createStore(() => (
        { protocols: [mockProtocol], currentProtocolId: mockProtocol.id }
      ));
      const subj = shallow((
        <ConnectedSettingsScreen
          store={mockStore}
          match={{ params: { id: 1 } }}
        />
      ));
      expect(subj.prop('protocol')).toEqual(mockProtocol);
    });
  });
});
