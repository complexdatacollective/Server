/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';

import SortablePanels from '../SortablePanels';

jest.mock('react-sortable-hoc', () => ({
  SortableContainer: jest.fn(component => component),
  SortableElement: jest.fn(component => component),
  SortableHandle: jest.fn(component => component),
}));

describe('SortablePanel', () => {
  it('renders children mapped from a "panels" prop', () => {
    const panels = [<div>mock</div>];
    const subject = shallow(<SortablePanels panels={panels} />);
    expect(subject.contains(panels[0])).toBe(true);
  });

  it('defines an index for sorting', () => {
    const panels = [<div>mock</div>, <div>mock</div>];
    const subject = shallow(<SortablePanels panels={panels} />).find('Panel');
    expect(subject.get(0).props.index).toBe(0);
    expect(subject.get(1).props.index).toBe(1);
  });
});
