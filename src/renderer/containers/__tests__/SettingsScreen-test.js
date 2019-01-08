/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';
import { createStore } from 'redux';

import ConnectedSettingsScreen, { UnconnectedSettingsScreen as SettingsScreen } from '../SettingsScreen';

describe('<SettingsScreen />', () => {
  const deleteProtocol = jest.fn();
  const setExcludedVariables = jest.fn();
  const mockProtocol = { id: '1', name: '1', createdAt: new Date() };
  let subject;

  beforeEach(() => {
    const match = { params: { id: mockProtocol.id } };
    const props = {
      match,
      deleteProtocol,
      protocolsHaveLoaded: true,
      setExcludedVariables,
    };
    subject = shallow(<SettingsScreen {...props} />);
  });

  it('should render', () => {
    subject.setProps({ protocol: mockProtocol });
    expect(subject.find('h1')).toHaveLength(1);
  });

  it('renders a spinner while loading', () => {
    subject.setProps({ protocolsHaveLoaded: false });
    expect(subject.find('Spinner')).toHaveLength(1);
  });

  it('renders a delete button', () => {
    subject.setProps({ protocol: mockProtocol });
    expect(subject.find('Button')).toHaveLength(1);
  });

  it('renders checkboxes for chart variable selection', () => {
    const distributionVariables = { person: ['catVar'] };
    subject.setProps({ protocol: mockProtocol, distributionVariables });
    expect(subject.find('CheckboxGroup')).toHaveLength(1);
  });

  it('updates excluded variables from checkbox input', () => {
    const distributionVariables = { person: ['catVar'] };
    subject.setProps({ protocol: mockProtocol, distributionVariables });
    expect(setExcludedVariables).not.toHaveBeenCalled();
    const checkboxes = subject.find('CheckboxGroup');
    const input = checkboxes.dive().find('Checkbox').dive().find('input');
    input.simulate('change', []);
    expect(setExcludedVariables).toHaveBeenCalled();
  });

  describe('clicking delete', () => {
    afterEach(() => { deleteProtocol.mockClear(); });

    it('should delete a protocol', () => {
      global.confirm = jest.fn().mockReturnValue(true);
      subject.setProps({ protocol: mockProtocol });
      subject.find('Button').simulate('click');
      expect(deleteProtocol).toHaveBeenCalled();
    });

    it('requires user confirmation', () => {
      global.confirm = jest.fn().mockReturnValue(false);
      subject.setProps({ protocol: mockProtocol });
      subject.find('Button').simulate('click');
      expect(deleteProtocol).not.toHaveBeenCalled();
    });
  });

  describe('when connected', () => {
    it('sets protocol based on store state & URL match', () => {
      const mockStore = createStore(() => (
        { protocols: [mockProtocol] }
      ));
      const subj = shallow((
        <ConnectedSettingsScreen
          store={mockStore}
          match={{ params: { id: mockProtocol.id } }}
        />
      ));
      expect(subj.prop('protocol')).toEqual(mockProtocol);
    });
  });
});
