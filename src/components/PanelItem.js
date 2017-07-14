import React from 'react';
import PropTypes from 'prop-types';

const PanelItem = ({ label, value }) => (
  <div className="panel-item">
    <div className="panel-item__label">{label}</div>
    <div className="panel-item__value">
      {value}
    </div>
  </div>
);

PanelItem.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};

export default PanelItem;
