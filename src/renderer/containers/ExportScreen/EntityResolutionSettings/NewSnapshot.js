import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import Radio from '@codaco/ui/lib/components/Fields/Radio';
import Text from '@codaco/ui/lib/components/Fields/Text';

const NewSnapshot = ({
  isSelected,
  newSessionCount,
  onSelectCreateNewResolution,
  onUpdateSetting,
  entityResolutionPath,
  minimumThreshold,
}) => (
  <React.Fragment>
    <tr>
      <td colSpan="4">
        <Radio
          label={`Resolve new sessions (${newSessionCount})`}
          input={{
            name: 'create_new_snapshot',
            checked: isSelected,
            onChange: onSelectCreateNewResolution,
          }}
        />
      </td>
    </tr>
    <tr>
      <td colSpan="4" className="snapshots__row--no-padding">
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={isSelected ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
        >
          <table className="new-snapshot">
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
        </motion.div>
      </td>
    </tr>
  </React.Fragment>
);

NewSnapshot.propTypes = {
  onSelectCreateNewResolution: PropTypes.func.isRequired,
  isSelected: PropTypes.bool.isRequired,
  newSessionCount: PropTypes.number,
  onUpdateSetting: PropTypes.func.isRequired,
  entityResolutionPath: PropTypes.string,
  minimumThreshold: PropTypes.string,
};

NewSnapshot.defaultProps = {
  entityResolutionPath: '',
  minimumThreshold: 0,
  newSessionCount: 0,
};

export default NewSnapshot;
