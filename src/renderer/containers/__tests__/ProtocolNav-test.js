/* eslint-env jest */
import React from 'react';
import { createStore } from 'redux';
import { shallow } from 'enzyme';
import { ipcRenderer } from 'electron';

import { ConnectedProtocolNav, UnconnectedProtocolNav as ProtocolNav, ipcChannels } from '../ProtocolNav';

jest.mock('electron');

const mockProps = {
  loadProtocols: jest.fn(),
  location: {},
};

describe('<ProtocolNav />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders a connected drop target for new protocols', () => {
    const subject = shallow(<ProtocolNav {...mockProps} />);
    expect(subject.find('Connect(FileDropTarget)')).toHaveLength(1);
  });

  it('renders protocol thumbnails inside the drop target', () => {
    const subject = shallow(<ProtocolNav {...mockProps} />);
    expect(subject.find('Connect(FileDropTarget)').find('ProtocolThumbnails')).toHaveLength(1);
  });

  it('loads protocols on mount', () => {
    expect(mockProps.loadProtocols).not.toHaveBeenCalled();
    shallow(<ProtocolNav {...mockProps} />);
    expect(mockProps.loadProtocols).toHaveBeenCalled();
  });

  it('registers an update listener on mount', () => {
    const handler = expect.any(Function);
    expect(ipcRenderer.on).not.toHaveBeenCalled();
    shallow(<ProtocolNav {...mockProps} />);
    expect(ipcRenderer.on).toHaveBeenCalledWith(ipcChannels.FileImportUpdated, handler);
  });

  it('removes the listener on unmount', () => {
    const handler = expect.any(Function);
    const subject = shallow(<ProtocolNav {...mockProps} />);
    subject.unmount();
    expect(ipcRenderer.removeListener).toHaveBeenCalledWith(ipcChannels.FileImportUpdated, handler);
  });

  describe('add button', () => {
    let thumbnails;

    beforeEach(() => {
      thumbnails = shallow(<ProtocolNav {...mockProps} />).find('ProtocolThumbnails');
    });

    it('is rendered in with the thumbnails', () => {
      expect(thumbnails.dive().find('button')).toHaveLength(1);
    });

    it('requests native Open dialog on click', () => {
      expect(ipcRenderer.send).not.toHaveBeenCalled();
      const btn = thumbnails.dive().find('button');
      btn.simulate('click');
      expect(ipcRenderer.send).toHaveBeenCalledWith(ipcChannels.RequestFileImportDialog);
    });
  });

  describe('Connected', () => {
    const state = {
      protocols: [{ id: 'protocol1', name: '1', createdAt: new Date() }],
    };
    let store;
    beforeEach(() => {
      store = createStore(() => state);
    });

    it('maps a dispatched loadProtocols function', () => {
      const subject = shallow(<ConnectedProtocolNav store={store} location={{}} />);
      expect(subject.prop('loadProtocols')).toBeInstanceOf(Function);
    });

    it('maps protocols to props', () => {
      const subject = shallow(<ConnectedProtocolNav store={store} location={{}} />);
      expect(subject.prop('protocols')).toEqual(state.protocols);
    });
  });
});
