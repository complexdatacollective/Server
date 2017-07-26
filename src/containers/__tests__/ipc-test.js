/* eslint-env jest */

import React from 'react';
import { mount, shallow } from 'enzyme';
import { ipcRenderer } from 'electron';
import ipc from '../ipc';

jest.mock('electron');

const property = 'serverProperty';
const PROPERTY = 'SERVER_PROPERTY';

const MockComponent = () => (
  <div>Intentionally left empty</div>
);

const propertyConnector = ipc(property);
const WrappedComponent = propertyConnector(MockComponent);

describe('ipc HOC', () => {
  beforeEach(() => {
    ipcRenderer.on.mockReset();
    ipcRenderer.send.mockReset();
  });

  it('It should render', () => {
    const subject = shallow(<WrappedComponent />);

    expect(subject).toMatchSnapshot();
  });

  it('It should request the property over IPC on initialisation', () => {
    shallow(<WrappedComponent />);

    expect(ipcRenderer.send.mock.calls[0][0]).toEqual(`REQUEST_${PROPERTY}`);
  });

  it('It should set props on the wrapped component ', () => {
    const subject = mount(<WrappedComponent />);

    // Manually call the listener with data from 'icpRender'
    const propertyListener = ipcRenderer.on.mock.calls.find(call => call[0] === `${PROPERTY}`)[1];
    const ipcEvent = {};
    const ipcData = { foo: 'bar' };
    propertyListener(ipcEvent, ipcData);

    // Check ipc data is assigned to wrapped component prop
    expect(subject.find(MockComponent).prop(property)).toEqual({ foo: 'bar' });
  });
});
