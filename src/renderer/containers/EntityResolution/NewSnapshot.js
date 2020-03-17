import React from 'react';
import PropTypes from 'prop-types';
import Radio from '@codaco/ui/lib/components/Fields/Radio';
import Text from '@codaco/ui/lib/components/Fields/Text';

const NewSnapshot = ({
  onSelectCreateNewSnapshot,
  isSelected,
  newSessionCount,
  onChangeEntityResolutionPath,
  entityResolutionPath,
}) => {
  const handleChangeEntityResolutionPath = e =>
    onChangeEntityResolutionPath(e.target.value);

  return (
    <div className="snapshot">
      <div>
        <Radio
          label={`Resolve new sessions (${newSessionCount})`}
          input={{
            name: 'create_new_snapshot',
            checked: isSelected,
            onChange: onSelectCreateNewSnapshot,
          }}
        />
      </div>
      { isSelected &&
        <table>
          <tbody>
            <tr>
              <td>
                Entity resolver path
              </td>
              <td>
                <Text
                  input={{
                    value: entityResolutionPath,
                    onChange: handleChangeEntityResolutionPath,
                    disabled: !isSelected,
                  }}
                />
              </td>
            </tr>
          </tbody>
        </table>
      }
    </div>
  );
};

NewSnapshot.propTypes = {
  onSelectCreateNewSnapshot: PropTypes.func.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onChangeEntityResolutionPath: PropTypes.func.isRequired,
  entityResolutionPath: PropTypes.string,
  newSessionCount: PropTypes.number,
};

NewSnapshot.defaultProps = {
  entityResolutionPath: '',
  newSessionCount: 0,
};

export default NewSnapshot;
