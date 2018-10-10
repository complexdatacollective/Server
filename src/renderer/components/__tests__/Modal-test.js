/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';

import Modal from '../Modal';

const props = {
  title: 'mock',
  onCancel: jest.fn(),
};

describe('Modal', () => {
  it('is not closed when clicking the background', () => {
    const modal = shallow(<Modal {...props} />);
    modal.find('.modal').simulate('click');
    expect(props.onCancel).not.toHaveBeenCalled();
  });

  it('is closed when clicking the background if requested', () => {
    const modal = shallow(<Modal {...props} closeWhenBackgroundClicked />);
    modal.find('.modal').simulate('click');
    expect(props.onCancel).toHaveBeenCalled();
  });

  it('is closed when clicking the cancel button', () => {
    const modal = shallow(<Modal {...props} />);
    modal.find('Button').simulate('click');
    expect(props.onCancel).toHaveBeenCalled();
  });
});
