/* eslint-disable react/jsx-props-no-spreading */
/* eslint-env jest */
import React from 'react';
import { createStore } from 'redux';
import { mount, shallow } from 'enzyme';

import AdminApiClient from '../../utils/adminApiClient'; // see __mocks__
import ConnectedFileDropTarget, { UnconnectedFileDropTarget as FileDropTarget } from '../FileDropTarget';

jest.mock('../../utils/adminApiClient');

const mockProps = {
  openDialog: jest.fn(),
  loadProtocols: jest.fn(),
};

describe('<FileDropTarget />', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(<FileDropTarget {...mockProps} />);
  });

  it('should accept dropped files', () => {
    wrapper.simulate('drop', { dataTransfer: { files: {} } });
    expect(AdminApiClient().post).toHaveBeenCalled();
  });

  it('sets an active state when entered', () => {
    expect(wrapper.state('draggingOver')).toBeFalsy();
    wrapper.simulate('dragenter');
    expect(wrapper.state('draggingOver')).toBeTruthy();
  });

  it('removes an active state on leave', () => {
    wrapper.simulate('dragenter');
    expect(wrapper.state('draggingOver')).toBeTruthy();
    wrapper.simulate('dragleave');
    expect(wrapper.state('draggingOver')).toBeFalsy();
  });

  it('has an active class when drag is active', () => {
    const block = 'file-drop-target';
    expect(wrapper.find(`.${block}`).hasClass(`${block}--active`)).toBe(false);
    wrapper.setState({ draggingOver: true });
    expect(wrapper.find(`.${block}`).hasClass(`${block}--active`)).toBe(true);
  });

  it('defines the file transfer as a copy', () => {
    const evtData = { dataTransfer: {} };
    wrapper.simulate('dragover', evtData);
    expect(evtData.dataTransfer.dropEffect).toEqual('copy');
  });

  describe('when upload succeeds', () => {
    const mockClient = {
      post: jest.fn().mockResolvedValue({}),
      get: jest.fn().mockResolvedValue({}),
    };
    beforeAll(() => {
      AdminApiClient.mockImplementation(() => mockClient);
    });

    it('displays no errors', () => {
      wrapper.simulate('drop', { dataTransfer: { files: {}, getData: () => '' } });
      expect(mockClient.post).toHaveBeenCalled();
      expect(mockProps.openDialog).not.toHaveBeenCalled();
    });
  });

  describe('when upload fails', () => {
    const mockErrorClient = {
      post: jest.fn().mockRejectedValue({}),
      get: jest.fn().mockResolvedValue({}),
    };

    beforeAll(() => {
      AdminApiClient.mockImplementation(() => mockErrorClient);
    });

    it('displays an error on empty file', (done) => {
      wrapper.simulate('drop', { dataTransfer: { files: {}, getData: () => '' } });
      // process on next loop, to allow callback to have been called
      setImmediate(() => {
        expect(mockErrorClient.post).toHaveBeenCalled();
        expect(mockProps.openDialog).toHaveBeenCalled();
        done();
      });
    });

    it('displays an error on url', (done) => {
      wrapper.simulate('drop', { dataTransfer: { files: {}, getData: () => 'some-url' } });
      // process on next loop, to allow callback to have been called
      setImmediate(() => {
        expect(mockErrorClient.post).toHaveBeenCalled();
        expect(mockProps.openDialog).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('Connected', () => {
    let store;
    beforeEach(() => {
      store = createStore(() => ({}));
    });

    it('maps a dispatched loadProtocols fn to props', () => {
      const subject = shallow(<ConnectedFileDropTarget store={store} />);
      expect(subject.prop('loadProtocols')).toBeInstanceOf(Function);
    });

    it('maps a dispatched showErrorMessage fn to props', () => {
      const subject = shallow(<ConnectedFileDropTarget store={store} />);
      expect(subject.prop('openDialog')).toBeInstanceOf(Function);
    });
  });
});
