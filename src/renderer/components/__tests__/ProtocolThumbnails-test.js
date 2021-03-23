/* eslint-disable react/jsx-props-no-spreading */
/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';

import ProtocolThumbnails from '../ProtocolThumbnails';

describe('<ProtocolThumbnails />', () => {
  it('renders thumbnails of protocols', () => {
    const protocol = { id: '1', name: 'p1', createdAt: new Date() };
    const props = { protocols: [protocol], onClickAddProtocol: jest.fn() };
    const subject = shallow(<ProtocolThumbnails {...props} />);
    expect(subject.find('ProtocolThumbnail')).toHaveLength(1);
  });
});
