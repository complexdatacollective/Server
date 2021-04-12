import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { DateTime } from 'luxon';
import { Button } from '@codaco/ui';
import HoverMarquee from '@codaco/ui/lib/components/HoverMarquee';
import icon from '../images/devices.svg';

/**
 * Renders a device icon & label.
 */
const DeviceCard = ({
  name,
  createdAt,
  disabled,
  onDeleteHandler,
}) => {
  const modifierClasses = cx(
    'device-card',
    { 'device-card--disabled': disabled },
  );

  const createdLabel = DateTime.fromJSDate(createdAt).toFormat('yyyy-LL-dd @ HH:mm');

  return (
    <div className={modifierClasses}>
      <div className="device-card__icon-section">
        <div className="device-icon">
          <img src={icon} alt="" />
        </div>
      </div>
      <div className="device-card__main-section">
        <h2 className="device-name"><HoverMarquee>{name}</HoverMarquee></h2>
        <h6>
          <HoverMarquee>
            Paired:
            {createdLabel}
          </HoverMarquee>
        </h6>
      </div>
      <div
        className="device-card__delete"
        onClick={onDeleteHandler}
        role="button"
        tabIndex={0}
      >
        <Button size="small" color="neon-coral" icon="delete">Remove</Button>
      </div>
    </div>
  );
};

DeviceCard.propTypes = {
  name: PropTypes.string,
  createdAt: PropTypes.object, // JS Date object
  onDeleteHandler: PropTypes.func,
  disabled: PropTypes.bool,
};

DeviceCard.defaultProps = {
  name: undefined,
  onDeleteHandler: undefined,
  createdAt: null,
  disabled: false,
};

export default DeviceCard;
