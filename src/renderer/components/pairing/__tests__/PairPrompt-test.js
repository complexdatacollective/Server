/* eslint-env jest */
import React from 'react';
import { mount, shallow } from 'enzyme';
import { Button } from '@codaco/ui';

import PairPrompt from '../PairPrompt';

const mockProps = {
  location: {},
  onAcknowledge: () => {},
  onDismiss: () => {},
};

describe('<PairPrompt />', () => {
  const isPairButton = node => (node.type() === Button) && (node.html().match(/Pair With Device/));

  it('should render a confirm button', () => {
    const subject = shallow(<PairPrompt {...mockProps} />);
    expect(subject.findWhere(isPairButton).length).toBe(1);
  });

  it('should be confirmable', () => {
    const confirm = jest.fn();
    const props = { ...mockProps, onAcknowledge: confirm };
    const subject = mount(<PairPrompt {...props} />);
    subject.findWhere(isPairButton).simulate('click');
    expect(confirm.mock.calls.length).toBe(1);
  });
});
