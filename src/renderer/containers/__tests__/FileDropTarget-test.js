/* eslint-env jest */
import React from 'react';
import { mount } from 'enzyme';

import { UnconnectedFileDropTarget as FileDropTarget } from '../FileDropTarget';

function mockClient() {}
mockClient.prototype.post = jest.fn(() => Promise.resolve({}));
mockClient.prototype.get = jest.fn(() => Promise.resolve({}));
jest.mock('../../utils/adminApiClient', () => mockClient);

const mockProps = {
  showMessage: jest.fn(),
};

describe('<FileDropTarget />', () => {
  it('should accept dropped files', () => {
    const wrapper = mount((
      <FileDropTarget {...mockProps} />
    ));

    wrapper.simulate('drop', { dataTransfer: { files: {} } });
    expect(mockClient.prototype.post).toHaveBeenCalled();
  });
});
