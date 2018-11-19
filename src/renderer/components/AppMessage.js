import React from 'react';
import PropTypes from 'prop-types';

import { Icon } from '../ui/components';
import Fade from './transitions/Fade';
import { messageTypes } from '../ducks/modules/appMessages';

const baseCssClass = 'app-message';

const modifierClass = (messageType) => {
  switch (messageType) {
    case messageTypes.Confirmation:
      return `${baseCssClass}--confirmation`;
    case messageTypes.Error:
      return `${baseCssClass}--error`;
    default:
      return '';
  }
};

const AppMessage = ({ text, type, isExpired }) => (
  <Fade transitionIn={!isExpired}>
    <div className={`${baseCssClass} ${modifierClass(type)}`}>
      <Icon name="close" size="small" color="red" className="app-message__close" />
      <div className="app-message__text">
        {text}
      </div>
    </div>
  </Fade>
);

AppMessage.propTypes = {
  type: PropTypes.any,
  text: PropTypes.string.isRequired,
  isExpired: PropTypes.bool,
};

AppMessage.defaultProps = {
  isExpired: false,
  type: null,
};

export default AppMessage;
