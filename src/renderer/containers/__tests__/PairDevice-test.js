/* eslint-env jest */

import React from 'react';
import { shallow } from 'enzyme';
import { PairDevice } from '../PairDevice';

describe('<PairDevice />', () => {
  it('should render a PIN prompt', () => {
    const subject = shallow((
      <PairDevice pairingCode="123" />
    ));

    expect(subject.find('PairPin')).toHaveLength(1);
  });
});
