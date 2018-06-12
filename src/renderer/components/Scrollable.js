import React from 'react';
import PropTypes from 'prop-types';

const Scrollable = ({ className, children }) => (
  <div className={`scrollable ${className}`}>{children}</div>
);

Scrollable.defaultProps = {
  className: '',
};

Scrollable.propTypes = {
  children: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
  className: PropTypes.string,
};

export default Scrollable;
