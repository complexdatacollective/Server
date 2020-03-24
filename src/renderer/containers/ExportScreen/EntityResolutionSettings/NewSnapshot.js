import React from 'react';
import PropTypes from 'prop-types';
import Radio from '@codaco/ui/lib/components/Fields/Radio';
import Text from '@codaco/ui/lib/components/Fields/Text';

const NewSnapshot = ({
  isSelected,
  newSessionCount,
  onSelectCreateNewResolution,
  onUpdateSetting,
  entityResolutionPath,
  minimumThreshold,
}) => {
  return (
    <div className="snapshot">
      <div>
        <Radio
          label={`Resolve new sessions (${newSessionCount})`}
          input={{
            name: 'create_new_snapshot',
            checked: isSelected,
            onChange: onSelectCreateNewResolution,
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
                    onChange: e => onUpdateSetting('entityResolutionPath', e.target.value),
                    disabled: !isSelected,
                  }}
                />
              </td>
            </tr>
            <tr>
              <td>
                Minimum threshold for matches
              </td>
              <td>
                <Text
                  input={{
                    inputMode: 'numeric',
                    pattern: '[0-9]*.[0-9]*',
                    value: minimumThreshold,
                    onChange: e => onUpdateSetting('minimumThreshold', e.target.value),
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
  onSelectCreateNewResolution: PropTypes.func.isRequired,
  isSelected: PropTypes.bool.isRequired,
  newSessionCount: PropTypes.number,
  options: PropTypes.shape({
    entityResolutionPath: PropTypes.string,
    minimumThreshold: PropTypes.string,
  }).isRequired,
};

NewSnapshot.defaultProps = {
  options: {
    entityResolutionPath: '',
    minimumThreshold: 0,
  },
  newSessionCount: 0,
};

export default NewSnapshot;
