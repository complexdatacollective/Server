import React from 'react';
import PropTypes from 'prop-types';

const Overflow = ({
  children, size, className, ...props
}) => {
  const classes = `overflow overflow--${size} ${className}`;

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <div className={classes} {...props}>
      { children }
    </div>
  );
};

Overflow.propTypes = {
  children: PropTypes.object.isRequired,
  className: PropTypes.string,
  size: PropTypes.string,
};

Overflow.defaultProps = {
  className: '',
  size: 'medium',
};

export default Overflow;
