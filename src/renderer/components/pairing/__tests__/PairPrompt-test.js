/* eslint-env jest */
import React from 'react';
import { render } from 'enzyme';
import { StaticRouter } from 'react-router-dom';

import PairPrompt from '../PairPrompt';

const mockProps = {
  location: {},
  onDismiss: () => {},
};

const renderRouted = component => render(<StaticRouter context={{}}>{ component }</StaticRouter>);

describe('<PairPrompt />', () => {
  it('should render a confirm button', () => {
    const subject = renderRouted(<PairPrompt {...mockProps} />);
    expect(subject.find('[href$="/modal/pair"]').length).toBe(1);
  });
});
