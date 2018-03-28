/* eslint-env jest */
import React from 'react';
import { mount } from 'enzyme';

import FileDropTarget from '../FileDropTarget';

function mockClient() {}
mockClient.prototype.post = jest.fn(() => Promise.resolve({}));
jest.mock('../../utils/adminApiClient', () => mockClient);

describe('<FileDropTarget />', () => {
  it('should accept dropped files', () => {
    const wrapper = mount((
      <FileDropTarget />
    ));

    wrapper.simulate('drop', { dataTransfer: { files: {} } });
    expect(mockClient.prototype.post).toHaveBeenCalled();
  });
});
