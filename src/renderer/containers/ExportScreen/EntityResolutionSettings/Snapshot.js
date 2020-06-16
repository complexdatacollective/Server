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
  sessionCount,
  transformCount,
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
      <td>{sessionCount}</td>
      <td>{transformCount}</td>
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
  transformCount: PropTypes.number,
  sessionCount: PropTypes.number,
};

Snapshot.defaultProps = {
  isSelected: false,
  canDelete: false,
  transformCount: 0,
  sessionCount: 0,
};

export default Snapshot;
