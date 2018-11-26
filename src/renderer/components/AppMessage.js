import React from 'react';
import PropTypes from 'prop-types';

import { Icon } from '../ui/components';
import Fade from './transitions/Fade';
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
        {text}
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
