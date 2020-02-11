import React from 'react';
import PropTypes from 'prop-types';
import Radio from '@codaco/ui/lib/components/Fields/Radio';
import Text from '@codaco/ui/lib/components/Fields/Text';

const NewSnapshot = ({ onSelectCreateNewSnapshot, isSelected }) => (
  <div
    className="snapshot"
    isSelected={isSelected}
  >
    <div>
      <Radio
        label={`Resolve new sessions (${0})`}
        input={{
          name: 'create_new_snapshot',
          checked: isSelected,
          onChange: onSelectCreateNewSnapshot,
        }}
      />
    </div>
    <table>
      <tbody>
        <tr>
          <td>
            Entity resolver path
          </td>
          <td>
            <Text
              input={{
                value: '',
                onChange: () => {},
              }}
            />
          </td>
        </tr>
        <tr>
          <td>
            Previously resolved
          </td>
          <td>
            0
          </td>
        </tr>
      </tbody>
    </table>
  </div>
);

NewSnapshot.propTypes = {
  onSelectCreateNewSnapshot: PropTypes.func.isRequired,
  isSelected: PropTypes.bool.isRequired,
};

export default NewSnapshot;
