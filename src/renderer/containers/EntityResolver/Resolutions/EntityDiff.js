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
  nodeTypeDefinition,
  match,
  requiredAttributes,
  resolvedAttributes,
  setAttributes,
  setNotAMatch,
  isAMatch,
}) => {
  const [showHidden, setShowHidden] = useState(false);

  useEffect(() => {
    setShowHidden(false);
  }, [getMatchId(match)]);

  const [a, b] = match.nodes;

  const color = get(nodeTypeDefinition, 'color');
  const variables = get(nodeTypeDefinition, 'variables', {});
  const nodePropsA = { label: getLabel(nodeTypeDefinition, a), color };
  const nodePropsB = { label: getLabel(nodeTypeDefinition, b), color };
  const getVariableResolution = variable => get(resolvedAttributes, variable);
  const getVariableName = variable => get(variables, [variable, 'name']);

  console.log({ nodeTypeDefinition, variables });

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

  const allChecked = Object.values(resolvedAttributes).length === requiredAttributes.length ?
    [
      Object.values(resolvedAttributes).every(v => v === 0),
      Object.values(resolvedAttributes).every(v => v === 1),
    ] :
    [false, false];

  const setAll = value =>
    setAttributes(
      requiredAttributes.reduce(
        (acc, attribute) => ({ ...acc, [attribute]: value }), {},
      ),
    );

  const handleToggleHidden = () => setShowHidden(s => !s);

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
                  checked={allChecked[0]}
                  input={{ onChange: () => setAll(0) }}
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
                  checked={allChecked[1]}
                  input={{ onChange: () => setAll(1) }}
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
                  checked={isAMatch === false}
                  input={{
                    onChange: setNotAMatch,
                  }}
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
                        onChange: () => setAttributes({ [variable]: 0 }),
                      }}
                    />
                  </td>
                  <td className="entity-diff__table-clickable">
                    <Radio
                      label={formatVariable(values[1])}
                      checked={checked[1]}
                      input={{
                        onChange: () => setAttributes({ [variable]: 1 }),
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
  setAttributes: PropTypes.func.isRequired,
  setNotAMatch: PropTypes.func.isRequired,
  isAMatch: PropTypes.bool,
};

EntityDiff.defaultProps = {
  match: null,
  nodeTypeDefinition: null,
  isAMatch: false,
  requiredAttributes: [],
  resolvedAttributes: {},
};

const areEqual = (prevProps, props) => {
  const isIndexMatch = get(prevProps, 'match.index') === get(props, 'match.index');
  const isResolvedMatch = isEqual(get(prevProps, 'resolvedAttributes'), get(props, 'resolvedAttributes'));
  const isNodeDefinitionMatch = isEqual(get(prevProps, 'nodeTypeDefinition'), get(props, 'nodeTypeDefinition'));

  return isIndexMatch && isResolvedMatch && isNodeDefinitionMatch;
}

export default React.memo(EntityDiff, areEqual);
