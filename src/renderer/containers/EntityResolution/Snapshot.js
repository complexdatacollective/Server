import React from 'react';
import { DateTime } from 'luxon';
import PropTypes from 'prop-types';
import Radio from '@codaco/ui/lib/components/Fields/Radio';
// import DrawerTransition from '../ui/components/Transitions/Drawer';

const Snapshot = ({
  date,
  sessions,
  settings,
  id,
  isSelected,
  canRollback,
  onSelect,
}) => {
  const displayDate = DateTime.fromISO(date).toHTTP();

  return (
    <div className="snapshot">
      <div>
        <Radio
          label={displayDate}
          input={{
            name: `${id}[]`,
            checked: isSelected,
            value: id,
            onChange: () => onSelect(id),
          }}
        />
        {/* {sessions} */}
        {/* { canRollback &&
          <button type="button">rollback</button>
        } */}
      </div>
      <div>
        {/* {settings.path} */}
      </div>
    </div>
  );
};

Snapshot.propTypes = {
  date: PropTypes.string.isRequired,
  // sessions: PropTypes.number.isRequired,
  settings: PropTypes.object.isRequired,
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  isSelected: PropTypes.bool,
  // canRollback: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
};

Snapshot.defaultProps = {
  isSelected: false,
  canRollback: false,
};

export default Snapshot;
