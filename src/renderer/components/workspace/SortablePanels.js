import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { SortableContainer } from 'react-sortable-hoc';

import SortablePanel from './SortablePanel';

/**
 * Render a collection of sortable workspace panels.
 * Note: SortableContainer must render a containing DOM element (<div>) around the
 * SortableElement collection.
 */
class Panels extends PureComponent {
  render() {
    const { className, panels } = this.props;
    return (
      <div className={className}>
        {
          panels.map((panel, index) => (
            <SortablePanel key={`${panel.key}-panel`} index={index} disabled={panel.props.disabled || false}>
              { panel }
            </SortablePanel>
          ))
        }
      </div>
    );
  }
}

Panels.defaultProps = {
  className: '',
};

Panels.propTypes = {
  className: PropTypes.string,
  panels: PropTypes.arrayOf(PropTypes.node).isRequired,
};

export default SortableContainer(Panels, { withRef: true });
