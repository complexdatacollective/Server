/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';

import SortablePanel from '../SortablePanel';

jest.mock('react-sortable-hoc', () => ({
  SortableElement: jest.fn(component => component),
}));

describe('SortablePanel', () => {
  it('renders provided children', () => {
    const children = <div>mock</div>;
    const sortable = shallow(<SortablePanel index={0}>{children}</SortablePanel>);
    expect(sortable.contains(children)).toBe(true);
  });
});
