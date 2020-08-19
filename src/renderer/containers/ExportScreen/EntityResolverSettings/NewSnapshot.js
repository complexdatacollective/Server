import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { isEmpty, get } from 'lodash';
import Radio from '@codaco/ui/lib/components/Fields/Radio';
import Text from '@codaco/ui/lib/components/Fields/Text';
import BrowseInput from '%components/BrowseInput';
import withValidation from './withValidation';

const variants = {
  hide: { height: 0, opacity: 0 },
  show: { height: 'auto', opacity: 1 },
};

const ValidatedBrowseInput = withValidation(BrowseInput);

const formatSessionCount = (sessionCount) => {
  if (sessionCount === 1) {
    return `${sessionCount} new session`;
  }

  return `${sessionCount} new sessions`;
};

const isRequired = (value) => {
  console.log('hi');
  if (!isEmpty(value)) { return undefined; }
  return 'Required';
};

const NewSnapshot = ({
  egoCastType,
  entityResolutionArguments,
  entityResolutionPath,
  hasResolutionHistory,
  isSelected,
  newSessionCount,
  nodeTypes,
  onSelectCreateNewResolution,
  onUpdateSetting,
}) => {
  const handleUpdateEgoCastType = e =>
    onUpdateSetting('egoCastType', isEmpty(e.target.value) ? undefined : e.target.value);

  const handleSelectResolver = (value) => {
    onUpdateSetting('entityResolutionPath', value);
  };

  return (
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
                        onChange={handleUpdateEgoCastType}
                        value={egoCastType || ''}
                        disabled={hasResolutionHistory || !isSelected}
                        required
                      >
                        <option value="">&mdash; Select a node type &mdash;</option>
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
                      <ValidatedBrowseInput
                        input={{
                          value: entityResolutionPath,
                          onChange: handleSelectResolver,
                          disabled: !isSelected,
                        }}
                        validate={isRequired}
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
};

NewSnapshot.propTypes = {
  egoCastType: PropTypes.string,
  entityResolutionArguments: PropTypes.string,
  entityResolutionPath: PropTypes.string,
  hasResolutionHistory: PropTypes.bool,
  isSelected: PropTypes.bool.isRequired,
  newSessionCount: PropTypes.number,
  nodeTypes: PropTypes.array,
  onSelectCreateNewResolution: PropTypes.func.isRequired,
  onUpdateSetting: PropTypes.func.isRequired,
};

NewSnapshot.defaultProps = {
  egoCastType: '',
  entityResolutionArguments: '',
  entityResolutionPath: '',
  hasResolutionHistory: false,
  newSessionCount: 0,
  nodeTypes: [],
};

export default NewSnapshot;
