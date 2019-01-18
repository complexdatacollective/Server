import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { SortableElement, SortableHandle } from 'react-sortable-hoc';

const DragHandle = SortableHandle(() => <div className="sortable__handle" />);

class Panel extends PureComponent {
  render() {
    const { children } = this.props;
    return (
      <div className="sortable">
        { children }
        <DragHandle />
      </div>
    );
  }
}

Panel.propTypes = {
  children: PropTypes.node.isRequired,
};

export default SortableElement(Panel);
