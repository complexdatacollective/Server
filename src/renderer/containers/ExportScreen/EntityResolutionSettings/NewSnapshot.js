import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import Radio from '@codaco/ui/lib/components/Fields/Radio';
import Text from '@codaco/ui/lib/components/Fields/Text';

const variants = {
  hidden: { height: 0, opacity: 0 },
  show: { height: 'auto', opacity: 1 },
};

const NewSnapshot = ({
  isSelected,
  newSessionCount,
  onSelectCreateNewResolution,
  onUpdateSetting,
  entityResolutionPath,
  entityResolutionArguments,
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
          variants={variants}
          initial="hide"
          animate={isSelected ? 'show' : 'hide'}
        >
          <div className="new-snapshot">
            <h4>Entity Resolver</h4>
            <table className="new-snapshot__options">
              <tbody>
                <tr>
                  <th>
                    Script path
                  </th>
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
                  <th>
                    Script arguments
                  </th>
                  <td>
                    <Text
                      input={{
                        value: entityResolutionArguments,
                        onChange: e => onUpdateSetting('entityResolutionArguments', e.target.value),
                        disabled: !isSelected,
                      }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
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
  entityResolutionArguments: PropTypes.string,
};

NewSnapshot.defaultProps = {
  entityResolutionPath: '',
  entityResolutionArguments: '',
  newSessionCount: 0,
};

export default NewSnapshot;
