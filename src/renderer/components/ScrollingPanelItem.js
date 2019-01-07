import React from 'react';
import PropTypes from 'prop-types';

import Scrollable from './Scrollable';

const ScrollingPanelItem = ({ children, header }) => (
  <div className="dashboard__panel dashboard__panel--scrollable">
    <div className="dashboard__header">{header}</div>
    <Scrollable className="dashboard__panel-content">
      {children}
    </Scrollable>
  </div>
);

ScrollingPanelItem.defaultProps = {
  header: '',
};

ScrollingPanelItem.propTypes = {
  children: PropTypes.oneOfType([PropTypes.array, PropTypes.object, PropTypes.string]).isRequired,
  header: PropTypes.oneOfType([PropTypes.array, PropTypes.object, PropTypes.string]),
};

export default ScrollingPanelItem;
