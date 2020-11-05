import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { DateTime } from 'luxon';
import HoverMarquee from '@codaco/ui/lib/components/HoverMarquee';
import icon from '../images/devices.png';
/**
 * Renders a device icon & label.
 */
const DeviceCard = ({
  name,
  id,
  createdAt,
  disabled,
  onClickHandler,
}) => {
  const modifierClasses = cx(
    'device-card',
    { 'device-card--clickable': onClickHandler },
    { 'device-card--disabled': disabled },
  );

  const createdLabel = DateTime.fromJSDate(createdAt).toFormat('yyyy-LL-dd @ HH:mm');

  return (
    <div className={modifierClasses} onClick={onClickHandler}>
      <div className="device-card__icon-section">
        <div className="device-icon">
          <img src={icon} alt="" />
        </div>
      </div>
      <div className="device-card__main-section">
        <h2 className="device-name"><HoverMarquee>{name}</HoverMarquee></h2>
        <h6><HoverMarquee>{id}</HoverMarquee></h6>
        <h6><HoverMarquee>{createdLabel}</HoverMarquee></h6>
      </div>
    </div>
  );
};

DeviceCard.propTypes = {
  name: PropTypes.string,
  id: PropTypes.string,
  createdAt: PropTypes.string,
  onClickHandler: PropTypes.func,
  disabled: PropTypes.bool,
};

DeviceCard.defaultProps = {
  name: undefined,
  onClickHandler: undefined,
  id: null,
  createdAt: null,
  disabled: false,
};

export default DeviceCard;
