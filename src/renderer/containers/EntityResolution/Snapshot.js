import React from 'react';
import Radio from '../../ui/components/Fields/Radio';
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

export default Snapshot;
