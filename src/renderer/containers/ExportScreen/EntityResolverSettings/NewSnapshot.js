import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { isEmpty } from 'lodash';
import Radio from '@codaco/ui/lib/components/Fields/Radio';
import Text from '@codaco/ui/lib/components/Fields/Text';
import Tip from '../../../components/Tip';
import BrowseInput from '../../../components/BrowseInput';
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
  if (!isEmpty(value)) { return undefined; }
  return 'Required';
};

const NewSnapshot = ({
  hasResolutionHistory,
  isSelected,
  newSessionCount,
  nodeTypes,
  onSelect,
  onUpdateOption,
  options,
}) => {
  const handleUpdateEgoCastType = e =>
    onUpdateOption('egoCastType', isEmpty(e.target.value) ? undefined : e.target.value);

  return (
    <React.Fragment>
      <tr>
        <td>
          <Radio
            label={`Resolve new sessions (${formatSessionCount(newSessionCount)})`}
            input={{
              name: 'create_new_snapshot',
              checked: isSelected,
              onChange: () => onSelect(),
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
                      Ego Node Cast Type
                    </th>
                    <td>
                      <select
                        className="select-field"
                        onChange={handleUpdateEgoCastType}
                        value={options.egoCastType || ''}
                        disabled={hasResolutionHistory || !isSelected}
                        required
                      >
                        <option value="">&mdash; Select a node type to convert the ego to&mdash;</option>
                        {nodeTypes.map(({ label, value }) => (
                          <option value={value} key={value}>{label}</option>
                        ))}
                      </select>
                      { (hasResolutionHistory || !isSelected) &&
                        <Tip type="warning">
                          <p>
                            Ego node cast type cannot be changed whilst there are
                            existing resolutions because the results are cumulative.
                          </p>
                        </Tip>
                      }
                    </td>
                  </tr>
                  <tr>
                    <th>
                      Interpreter
                    </th>
                    <td>
                      <ValidatedBrowseInput
                        input={{
                          value: options.interpreterPath,
                          onChange: value => onUpdateOption('interpreterPath', value),
                          disabled: !isSelected,
                        }}
                        validate={isRequired}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>
                      Resolver Script Path
                    </th>
                    <td>
                      <ValidatedBrowseInput
                        input={{
                          value: options.resolverPath,
                          onChange: value => onUpdateOption('resolverPath', value),
                          disabled: !isSelected,
                        }}
                        validate={isRequired}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>
                      Resolver Script Arguments
                    </th>
                    <td>
                      <Text
                        input={{
                          value: options.args,
                          onChange: e => onUpdateOption('args', e.target.value),
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

  hasResolutionHistory: PropTypes.bool,
  isSelected: PropTypes.bool.isRequired,
  newSessionCount: PropTypes.number,
  nodeTypes: PropTypes.array,
  onSelect: PropTypes.func.isRequired,
  onUpdateOption: PropTypes.func.isRequired,
  options: PropTypes.shape({
    args: PropTypes.string,
    egoCastType: PropTypes.string,
    interpreterPath: PropTypes.string,
    resolverPath: PropTypes.string,
  }),
};

NewSnapshot.defaultProps = {
  egoCastType: '',
  entityResolutionArguments: '',
  entityResolutionPath: '',
  hasResolutionHistory: false,
  newSessionCount: 0,
  nodeTypes: [],
  options: {},
};

export default NewSnapshot;
