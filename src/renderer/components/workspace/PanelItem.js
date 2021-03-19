import React from 'react';
import PropTypes from 'prop-types';

const renderItem = (item) => <div key={item} className="panel-item__value">{item}</div>;

const renderValue = (value, placeholder) => {
  if (Array.isArray(value)) {
    return value.map((item) => renderItem(item));
  }
  if (value) {
    return renderItem(value);
  }
  return (<div className="panel-item__placeholder">{ placeholder }</div>);
};

const PanelItem = ({ label, placeholder, value }) => (
  <div className="panel-item">
    <div className="panel-item__label">{label}</div>
    {
      renderValue(value, placeholder)
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
    PropTypes.array,
  ]),
};

export default PanelItem;
