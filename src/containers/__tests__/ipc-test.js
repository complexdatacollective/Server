/* eslint-env jest */

import React from 'react';
import { mount, shallow } from 'enzyme';
import { ipcRenderer, remote } from 'electron';
import ipc from '../ipc';

jest.mock('electron');

const globalProperty = 'server';

const MockComponent = () => (
  <div>Intentionally left empty</div>
);

function setup(property = globalProperty) {
  const serverGlobalConnector = ipc(property);
  return {
    component: serverGlobalConnector(MockComponent),
  };
}

describe('ipc HOC', () => {
  beforeEach(() => {
    ipcRenderer.on.mockReset();
  });

  it('It should render', () => {
    const Component = setup().component;
    const subject = shallow(<Component />);

    expect(subject).toMatchSnapshot();
  });

  it('It should return a HOC Wrapped Component', () => {
    remote.getGlobal
      .mockReturnValueOnce({ foo: 'bar' })
      .mockReturnValueOnce({ baz: 'buzz' });

    const Component = setup().component;

    const subject = mount((
      <Component foo="bar" />
    )).find('MockComponent');

    expect(subject.prop(globalProperty)).toEqual({ foo: 'bar' });

    const globalUpdatedCallback = ipcRenderer.on.mock.calls[0][1];
    globalUpdatedCallback();

    expect(subject.prop(globalProperty)).toEqual({ baz: 'buzz' });
  });
});
