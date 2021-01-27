import React from 'react';
import PropTypes from 'prop-types';
import { isEmpty } from 'lodash';
import Text from '@codaco/ui/lib/components/Fields/Text';
import Tip from '../../components/Tip';
import BrowseInput from '../../components/BrowseInput';
import withValidation from './withValidation';

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
  onUpdate,
  options,
}) => {
  const handleUpdateEgoCastType = e =>
    onUpdate('egoCastType', isEmpty(e.target.value) ? undefined : e.target.value);

  return (
    <div className="new-snapshot">
      <p>
        There are <strong>{`${formatSessionCount(newSessionCount)}`}</strong> since the last resolution.
      </p>
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
                  onChange: value => onUpdate('interpreterPath', value),
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
                  onChange: value => onUpdate('resolverPath', value),
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
                  onChange: e => onUpdate('args', e.target.value),
                  disabled: !isSelected,
                }}
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

NewSnapshot.propTypes = {
  hasResolutionHistory: PropTypes.bool,
  isSelected: PropTypes.bool.isRequired,
  newSessionCount: PropTypes.number,
  nodeTypes: PropTypes.array,
  onUpdate: PropTypes.func.isRequired,
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
