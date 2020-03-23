import React from 'react';
import { DateTime } from 'luxon';
import PropTypes from 'prop-types';
import Radio from '@codaco/ui/lib/components/Fields/Radio';

const Snapshot = ({
  id,
  date,
  isSelected,
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
      </div>
    </div>
  );
};

Snapshot.propTypes = {
  date: PropTypes.string.isRequired,
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  isSelected: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
};

Snapshot.defaultProps = {
  isSelected: false,
};

export default Snapshot;
