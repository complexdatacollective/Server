import React from 'react';
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
}) => (
  <div className="snapshot">
    <div>
      <Radio
        label={date}
        input={{
          name: `${id}[]`,
          checked: isSelected,
          value: id,
          onChange: () => onSelect(id),
        }}
      />
      {sessions}
      { canRollback &&
        <button type="button">rollback</button>
      }
    </div>
    <div>
      {settings.path}
    </div>
  </div>
);

Snapshot.propTypes = {
  date: PropTypes.string.isRequired,
  sessions: PropTypes.number.isRequired,
  settings: PropTypes.object.isRequired,
  id: PropTypes.string.isRequired,
  isSelected: PropTypes.bool,
  canRollback: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
};

Snapshot.defaultProps = {
  isSelected: false,
  canRollback: false,
};

export default Snapshot;
