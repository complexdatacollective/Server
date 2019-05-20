/* eslint-env jest */
import React from 'react';
import { mount } from 'enzyme';

import PairPin from '../PairPin';

describe('<PairPin />', () => {
  it('should render a code', () => {
    const code = 'passcode-123789';
    const subject = mount((<PairPin dismissPairingRequest={() => {}} code={code} />));
    expect(subject.text()).toMatch(code);
  });
});
