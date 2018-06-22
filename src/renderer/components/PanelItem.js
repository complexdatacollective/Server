import React from 'react';
import PropTypes from 'prop-types';

const PanelItem = ({ label, placeholder, value }) => (
  <div className="panel-item">
    <div className="panel-item__label">{label}</div>
    {
      value && <div className="panel-item__value">{value}</div>
    }
    {
      !value && <div className="panel-item__placeholder">{ placeholder }</div>
    }
  </div>
);

PanelItem.defaultProps = {
  placeholder: '',
  value: null,
};

PanelItem.propTypes = {
  label: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
};

export default PanelItem;
