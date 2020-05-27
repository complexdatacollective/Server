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
  onRollback,
  canRollback,
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
      <td />
      <td />
      <td>
        { canRollback &&
          <div className="snapshot__delete">
            <Button onClick={() => onRollback(id)} size="small">Rollback</Button>
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
  onRollback: PropTypes.func.isRequired,
  canRollback: PropTypes.bool,
};

Snapshot.defaultProps = {
  isSelected: false,
  canRollback: false,
};

export default Snapshot;
