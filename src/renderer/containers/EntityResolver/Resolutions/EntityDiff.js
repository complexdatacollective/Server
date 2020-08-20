import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { isNil, get, isPlainObject, isEqual } from 'lodash';
import { Button, Node } from '@codaco/ui';
import Radio from '@codaco/ui/lib/components/Fields/Radio';
import { nodePrimaryKeyProperty } from '%main/utils/formatters/network';
import { getLabel, getMatchId } from './selectors';
import './EntityDiff.scss';

const formatVariable = (variable) => {
  if (isNil(variable)) { return 'not set'; }
  if (isPlainObject(variable)) {
    return Object.keys(variable)
      .map(key => (
        <div>{key}: {variable[key]}</div>
      ));
  }
  return variable.toString();
};

const EntityDiff = ({
  match,
  entityDefinition,
  requiredAttributes,
  resolvedAttributes,
  isMatchAll,
  onSetAttributes,
  onSetNotAMatch,
  onSetLeft,
  onSetRight,
  isNotAMatch,
}) => {
  const [showHidden, setShowHidden] = useState(false);

  useEffect(() => {
    setShowHidden(false);
  }, [getMatchId(match)]);

  const handleToggleHidden = () => setShowHidden(s => !s);

  if (!match || !entityDefinition) { return null; }

  const [a, b] = get(match, 'nodes', []);

  const color = get(entityDefinition, 'color');
  const variables = get(entityDefinition, 'variables', {});
  const nodePropsA = { label: getLabel(entityDefinition, a), color };
  const nodePropsB = { label: getLabel(entityDefinition, b), color };
  const getVariableResolution = variable => get(resolvedAttributes, variable);
  const getVariableName = variable => get(variables, [variable, 'name']);

  console.log({ entityDefinition, variables });

  const rows = Object.keys(variables)
    .map(variable => ({
      variable,
      notSet: isNil(a.attributes[variable]) && isNil(b.attributes[variable]),
      required: requiredAttributes.includes(variable),
      values: [
        a.attributes[variable],
        b.attributes[variable],
      ],
      checked: [
        getVariableResolution(variable) === 0,
        getVariableResolution(variable) === 1,
      ],
    }));

  console.log({ rows, isNotAMatch });

  return (
    <div className="entity-diff">
      <table className="entity-diff__table" cellPadding="0" cellSpacing="0">
        <thead>
          <tr>
            <td className="entity-diff__table-heading">
              <div className="entity-diff__table-heading-context">
                {(match.probability * 100).toFixed(0)}% match
              </div>
              <div className="entity-diff__table-heading-fill" />
            </td>
            <td className="entity-diff__table-heading">
              <div className="entity-diff__table-heading-context">
                <Node {...nodePropsA} />
              </div>
              <div className="entity-diff__table-heading-cell" title={a[nodePrimaryKeyProperty]}>
                <Radio
                  label="Use all"
                  checked={isMatchAll === 'LEFT'}
                  input={{ onChange: onSetLeft }}
                />
              </div>
            </td>
            <td className="entity-diff__table-heading">
              <div className="entity-diff__table-heading-context">
                <Node {...nodePropsB} />
              </div>
              <div className="entity-diff__table-heading-cell" title={b[nodePrimaryKeyProperty]}>
                <Radio
                  label="Use all"
                  checked={isMatchAll === 'RIGHT'}
                  input={{ onChange: onSetRight }}
                />
              </div>
            </td>
            <td className="entity-diff__table-heading">
              <div className="entity-diff__table-heading-context">
                <div className="entity-diff__node-stack">
                  <Node {...nodePropsB} />
                  <Node {...nodePropsA} />
                </div>
              </div>
              <div className="entity-diff__table-heading-cell">
                <Radio
                  label="Not a match"
                  checked={isNotAMatch === true}
                  input={{ onChange: onSetNotAMatch }}
                />
              </div>
            </td>
          </tr>
        </thead>
        <tbody>
          {
            rows
              .filter(({ required }) => required)
              .map(({ variable, values, checked }) => (
                <tr key={`${match.index}_${variable}`}>
                  <th>{ getVariableName(variable) }</th>
                  <td className="entity-diff__table-clickable">
                    <Radio
                      label={formatVariable(values[0])}
                      checked={checked[0]}
                      input={{
                        onChange: () => onSetAttributes({ [variable]: 0 }),
                      }}
                    />
                  </td>
                  <td className="entity-diff__table-clickable">
                    <Radio
                      label={formatVariable(values[1])}
                      checked={checked[1]}
                      input={{
                        onChange: () => onSetAttributes({ [variable]: 1 }),
                      }}
                    />
                  </td>
                  <td />
                </tr>
              ))
          }
          {showHidden && rows
            .filter(({ required }) => !required)
            .map(({ variable, values }) => (
              <tr key={`${match.index}_${variable}`}>
                <th>{ getVariableName(variable) }</th>
                <td>
                  {formatVariable(values[0])}
                </td>
                <td>
                  {formatVariable(values[1])}
                </td>
                <td />
              </tr>
            ))
          }
          { !showHidden &&
            <tr>
              <th />
              <td colSpan="3" className="hidden-rows">

                <Button onClick={handleToggleHidden} size="small" color="platinum">
                  {rows.filter(({ required }) => !required).length} matching rows...
                </Button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  );
};

const EntityPropTypes = PropTypes.shape({
  attributes: PropTypes.object.isRequired,
  [nodePrimaryKeyProperty]: PropTypes.string.isRequired,
});

EntityDiff.propTypes = {
  match: PropTypes.shape({
    nodes: PropTypes.arrayOf(EntityPropTypes).isRequired,
    probability: PropTypes.number.isRequired,
    index: PropTypes.number.isRequired,
  }),
  nodeTypeDefinition: PropTypes.object,
  requiredAttributes: PropTypes.array,
  resolvedAttributes: PropTypes.object,
  onSetAttributes: PropTypes.func.isRequired,
  onSetNotAMatch: PropTypes.func.isRequired,
  onSetLeft: PropTypes.func.isRequired,
  onSetRight: PropTypes.func.isRequired,
  isMatchAll: PropTypes.string,
  isNotAMatch: PropTypes.bool,
};

EntityDiff.defaultProps = {
  match: null,
  nodeTypeDefinition: null,
  isNotAMatch: null,
  isMatchAll: null,
  requiredAttributes: [],
  resolvedAttributes: {},
};

const areEqual = (prevProps, props) => {
  const isIndexMatch = get(prevProps, 'match.index') === get(props, 'match.index');
  const isResolvedMatch = isEqual(get(prevProps, 'resolvedAttributes'), get(props, 'resolvedAttributes'));
  const isNotAMatch = prevProps.isNotAMatch === props.isNotAMatch;
  const isMatchAll = prevProps.isMatchAll === props.isMatchAll;
  const isNodeDefinitionMatch = isEqual(get(prevProps, 'nodeTypeDefinition'), get(props, 'nodeTypeDefinition'));

  return isIndexMatch && isResolvedMatch && isNodeDefinitionMatch && isMatchAll && isNotAMatch;
}

export default React.memo(EntityDiff, areEqual);
