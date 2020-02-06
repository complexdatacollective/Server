import React, { useState } from 'react';
import Checkbox from '../ui/components/Fields/Checkbox';
import DrawerTransition from '../ui/components/Transitions/Drawer';

const Snapshot = ({ date }) => (
  <div className="snapshot">
    {date}
  </div>
);


const useToggle = (initialState = false) => {
  const [state, setState] = useState(initialState);

  const handler = () => {
    setState(s => !s);
  };

  return [state, handler];
};

const EntityResolution = ({ show }) => {
  const [enableEntityResolution, handleToggleEntityResolution] = useToggle();

  const snapshots = [
    { id: 0, date: '06/02/2020', sessions: 10 },
    { id: 0, date: '07/02/2020', sessions: 10 },
  ];

  return (
    <div className="export__section">
      <DrawerTransition in={show}>
        <div className="export__subpanel">
          <h3>Entity Resolution</h3>
          <div className="export__subpanel-content">
            <Checkbox
              label="Enable entity resolution"
              input={{
                name: 'enable_entity_resolution', // TODO: is this necessary?
                checked: enableEntityResolution,
                onChange: handleToggleEntityResolution,
              }}
            />
          </div>
          <DrawerTransition in={enableEntityResolution}>
            <div className="export__subpanel-content">
              {snapshots.map(snapshot => (
                <Snapshot {...snapshot} />
              ))}
              <div className="snapshot">
                new snapshot
              </div>
            </div>
          </DrawerTransition>
        </div>
      </DrawerTransition>
    </div>
  );
};

export default EntityResolution;
