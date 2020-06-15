import React from 'react';
import { DateTime } from 'luxon';
import PropTypes from 'prop-types';
import Radio from '@codaco/ui/lib/components/Fields/Radio';
import { Button } from '@codaco/ui';

const Snapshot = ({
  id,
  date,
  isSelected,
  onSelect,
  onDelete,
  canDelete,
  sessions,
  transforms,
}) => {
  const displayDate = DateTime.fromISO(date).toHTTP();

  return (
    <tr>
      <td>
        <Radio
          input={{
            name: `${id}[]`,
            checked: isSelected,
            value: id,
            onChange: () => onSelect(id),
          }}
          label={displayDate}
        />
      </td>
      <td>{sessions}</td>
      <td>{transforms}</td>
      <td>
        { canDelete &&
          <div className="snapshot__delete">
            <Button onClick={() => onDelete(id)} size="small" color="coral">Delete</Button>
          </div>
        }
      </td>
    </tr>
  );
};

Snapshot.propTypes = {
  date: PropTypes.string.isRequired,
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  isSelected: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  canDelete: PropTypes.bool,
  transforms: PropTypes.number,
  sessions: PropTypes.number,
};

Snapshot.defaultProps = {
  isSelected: false,
  canDelete: false,
  transforms: 0,
  sessions: 0,
};

export default Snapshot;
