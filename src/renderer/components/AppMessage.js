import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from 'network-canvas-ui';

const AppMessage = ({ text }) => (
  <div className="app-message">
    <Icon name="close" size="small" color="red" className="app-message__close" />
    <div className="app-message__text">
      {text}
    </div>
  </div>
);

AppMessage.propTypes = {
  text: PropTypes.string.isRequired,
};

export default AppMessage;
