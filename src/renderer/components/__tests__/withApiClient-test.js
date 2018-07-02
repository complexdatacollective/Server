/* eslint-env jest */
import React from 'react';
import { mount, shallow } from 'enzyme';
import { ipcRenderer } from 'electron';

import withApiClient, { IPC } from '../withApiClient';
import AdminApiClient from '../../utils/adminApiClient';

jest.mock('electron');

describe('withApiClient HOC', () => {
  let MockComponent;

  beforeAll(() => {
    MockComponent = () => (<div />);
  });

  it('Provides an apiClient prop to the wrapped component', () => {
    const unwrapped = shallow(<MockComponent />);
    const wrapped = shallow(React.createElement(withApiClient(MockComponent)));
    expect(unwrapped.prop('apiClient')).not.toBeDefined();
    expect(wrapped.prop('apiClient')).toBeDefined();
    expect(wrapped.is('MockComponent')).toBe(true);
  });
});
