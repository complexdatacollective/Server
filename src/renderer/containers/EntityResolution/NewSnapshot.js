import React from 'react';
import Radio from '../../ui/components/Fields/Radio';
import Text from '../../ui/components/Fields/Text';

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

export default NewSnapshot;
