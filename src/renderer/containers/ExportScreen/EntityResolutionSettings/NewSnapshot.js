import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import Radio from '@codaco/ui/lib/components/Fields/Radio';
import Text from '@codaco/ui/lib/components/Fields/Text';

const variants = {
  hide: { height: 0, opacity: 0 },
  show: { height: 'auto', opacity: 1 },
};

const formatSessionCount = (sessionCount) => {
  if (sessionCount === 1) {
    return `${sessionCount} new session`;
  }

  return `${sessionCount} new sessions`;
};

const NewSnapshot = ({
  isSelected,
  newSessionCount,
  onSelectCreateNewResolution,
  onUpdateSetting,
  egoCastType,
  nodeTypes,
  entityResolutionPath,
  entityResolutionArguments,
}) => (
  <React.Fragment>
    <tr>
      <td>
        <Radio
          label={`Resolve new sessions (${formatSessionCount(newSessionCount)})`}
          input={{
            name: 'create_new_snapshot',
            checked: isSelected,
            onChange: onSelectCreateNewResolution,
          }}
        />
      </td>
      <td colSpan="4" />
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
                    Cast ego as node type
                  </th>
                  <td>
                    <select
                      className="select-field"
                      input={{
                        value: egoCastType,
                        onChange: e => onUpdateSetting('egoCastType', e.target.value),
                        disabled: !isSelected,
                      }}
                    >
                      <option>&mdash; Select a node type &mdash;</option>
                      {nodeTypes.map(({ label, value }) => (
                        <option value={value} key={value}>{label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
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
  nodeTypes: PropTypes.array,
  egoCastType: PropTypes.string,
  entityResolutionPath: PropTypes.string,
  entityResolutionArguments: PropTypes.string,
};

NewSnapshot.defaultProps = {
  nodeTypes: [],
  egoCastType: '',
  entityResolutionPath: '',
  entityResolutionArguments: '',
  newSessionCount: 0,
};

export default NewSnapshot;
