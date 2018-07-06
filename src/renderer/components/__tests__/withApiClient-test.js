/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';

import withApiClient from '../withApiClient';

describe('withApiClient HOC', () => {
  let MockComponent;

  beforeAll(() => {
    MockComponent = () => (<div />);
  });

  it('Provides an apiClient prop to the wrapped component', () => {
    const unwrapped = shallow(<MockComponent />);
    const wrapped = shallow(React.createElement(withApiClient(MockComponent)));
    expect(unwrapped.prop('apiClient')).not.toBeDefined();
    expect(wrapped.prop('apiClient')).toBeDefined();
    expect(wrapped.is('MockComponent')).toBe(true);
  });
});
