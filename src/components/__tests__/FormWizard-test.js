/* eslint-env jest */

import React from 'react';
import { shallow } from 'enzyme';
import FormWizard from '../FormWizard';

const nextButton = onClick => (<button onClick={onClick}>next</button>);
const prevButton = onClick => (<button onClick={onClick}>prev</button>);
const mockProps = {
  nextButton,
  prevButton,
};

describe('<FormWizard />', () => {
  it('should render', () => {
    const subject = shallow((
      <FormWizard {...mockProps}>
        <div>Slide 1</div>
        <div>Slide 2</div>
      </FormWizard>
    ));

    expect(subject).toMatchSnapshot();
  });
});
