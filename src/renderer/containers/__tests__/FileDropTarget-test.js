/* eslint-env jest */
import React from 'react';
import { createStore } from 'redux';
import { mount, shallow } from 'enzyme';

import AdminApiClient from '../../utils/adminApiClient'; // see __mocks__
import ConnectedFileDropTarget, { UnconnectedFileDropTarget as FileDropTarget } from '../FileDropTarget';

jest.mock('../../utils/adminApiClient');

const mockProps = {
  showMessage: jest.fn(),
};
mockProps.showMessage.bftest = 'bcf';

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

  describe('when upload fails', () => {
    const mockErrorClient = {
      post: jest.fn().mockRejectedValue({}),
      get: jest.fn().mockResolvedValue({}),
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

  describe('Connected', () => {
    let store;
    beforeEach(() => {
      store = createStore(() => ({}));
    });

    it('maps a dispatched loadProtocols fn to props', () => {
      const subject = shallow(<ConnectedFileDropTarget store={store} />);
      expect(subject.prop('loadProtocols')).toBeInstanceOf(Function);
    });

    it('maps a dispatched showMessage fn to props', () => {
      const subject = shallow(<ConnectedFileDropTarget store={store} />);
      expect(subject.prop('showMessage')).toBeInstanceOf(Function);
    });
  });
});
