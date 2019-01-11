import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { SortableElement } from 'react-sortable-hoc';

class Panel extends PureComponent {
  render() {
    const { children } = this.props;
    return (
      <div>
        { children }
      </div>
    );
  }
}

Panel.propTypes = {
  children: PropTypes.node.isRequired,
};

export default SortableElement(Panel);
