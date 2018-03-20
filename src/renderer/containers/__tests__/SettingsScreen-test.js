/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';
import SettingsScreen from '../SettingsScreen';

jest.mock('../../utils/adminApiClient');

describe('<SettingsScreen />', () => {
  it('should render', () => {
    const subject = shallow((
      <SettingsScreen />
    ));

    expect(subject.find('h1')).toHaveLength(1);
  });
});
