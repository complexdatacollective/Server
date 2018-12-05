import React from 'react';
import PropTypes from 'prop-types';

import Fade from './Transitions/Fade';
import { Icon } from '../ui/components';
import { messageTypes } from '../ducks/modules/appMessages';
import { isFrameless } from '../utils/environment';

const baseCssClass = 'app-message';

const modifierClass = (messageType) => {
  const frameClass = isFrameless() ? `${baseCssClass}--frameless` : '';
  switch (messageType) {
    case messageTypes.Confirmation:
      return `${baseCssClass}--confirmation ${frameClass}`;
    case messageTypes.Error:
      return `${baseCssClass}--error ${frameClass}`;
    default:
      return frameClass;
  }
};

const iconName = type => (type === messageTypes.Error ? 'error' : 'info');

const AppMessage = ({ text, type, isExpired, timestamp, handleDismissal }) => (
  <Fade transitionIn={!isExpired}>
    <div className={`${baseCssClass} ${modifierClass(type)}`}>
      <button onClick={() => handleDismissal(timestamp)} className="app-message__button">
        <Icon
          className="app-message__close"
          name="close"
          size="small"
          color="red"
        />
      </button>
      <div className="app-message__text">
        <Icon className="app-message__icon" name={iconName(type)} size="small" />
        <span>{text}</span>
      </div>
    </div>
  </Fade>
);

AppMessage.propTypes = {
  type: PropTypes.any,
  text: PropTypes.string.isRequired,
  isExpired: PropTypes.bool,
  timestamp: PropTypes.number.isRequired,
  handleDismissal: PropTypes.func.isRequired,
};

AppMessage.defaultProps = {
  isExpired: false,
  type: null,
};

export default AppMessage;
