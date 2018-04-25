/* eslint-env jest */
import React from 'react';
import { mount } from 'enzyme';

import AdminApiClient from '../../utils/adminApiClient';
import { UnconnectedFileDropTarget as FileDropTarget } from '../FileDropTarget';

jest.mock('../../utils/adminApiClient');

const mockProps = {
  showMessage: jest.fn(),
};
mockProps.showMessage.bftest = 'bcf';

describe('<FileDropTarget />', () => {
  let wrapper;
  const mockClient = {
    post: jest.fn(() => Promise.resolve({})),
    get: jest.fn(() => Promise.resolve({})),
  };

  beforeAll(() => {
    AdminApiClient.mockImplementation(() => mockClient);
  });

  beforeEach(() => {
    wrapper = mount(<FileDropTarget {...mockProps} />);
  });

  it('should render filenames', () => {
    const mockFilename = 'a.netcanvas';
    wrapper.setState({ protocols: [{ filename: mockFilename }] });
    expect(wrapper.find('li').text()).toMatch(mockFilename);
  });

  it('should accept dropped files', () => {
    wrapper.simulate('drop', { dataTransfer: { files: {} } });
    expect(mockClient.post).toHaveBeenCalled();
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

  describe('when upload fails', () => {
    const mockErrorClient = {
      post: jest.fn(() => Promise.reject({})),
      get: jest.fn(() => Promise.resolve({})),
    };

    beforeAll(() => {
      AdminApiClient.mockImplementation(() => mockErrorClient);
    });

    it('displays an error', (done) => {
      wrapper.simulate('drop', { dataTransfer: { files: {} } });
      // process on next loop, to allow callback to have been called
      setImmediate(() => {
        expect(mockErrorClient.post).toHaveBeenCalled();
        expect(mockProps.showMessage).toHaveBeenCalled();
        done();
      });
    });
  });
});
