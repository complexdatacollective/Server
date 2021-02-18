import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { isNil, get, isArray } from 'lodash';
import { Button, Node } from '@codaco/ui';
import Radio from '@codaco/ui/lib/components/Fields/Radio';
import { properties } from '../../../main/utils/resolver/helpers';
import { getLabel, getMatchId } from './selectors';
import VariableControl, { formatVariable } from './VariableControl';
import useEntityState from './useEntityState';
import './EntityDiff.scss';

const renderCaseID = (caseId) => {
  const caseIdString = isArray(caseId) ? caseId.join(' + ') : caseId;
  return <div className="entity-diff__table-heading-case-id">{caseIdString}</div>;
};

const EntityDiff = ({
  match,
  resolvedAttributes: existingResolvedAttributes,
  action: existingAction,
  entityDefinition,
  onChange,
}) => {
  if (!match || !entityDefinition) { return null; }

  const [diffState, diffActions] = useEntityState(
    entityDefinition,
    match,
    existingResolvedAttributes,
    existingAction,
  );

  const {
    requiredAttributes,
    resolvedAttributes,
    isMatchType,
    isDiffComplete,
    isTouched,
  } = diffState;
  const {
    setAttributes: onSetAttributes,
    setNotAMatch: onSetNotAMatch,
    setLeft: onSetLeft,
    setRight: onSetRight,
  } = diffActions;

  const [showHidden, setShowHidden] = useState(false);

  useEffect(() => {
    setShowHidden(false);
  }, [getMatchId(match)]);

  useEffect(() => {
    onChange({ isMatchType, isTouched, isDiffComplete, resolvedAttributes });
  }, [isMatchType, isTouched, isDiffComplete, JSON.stringify(resolvedAttributes)]);

  const handleToggleHidden = () => setShowHidden(s => !s);

  const [a, b] = get(match, 'nodes', []);

  const color = get(entityDefinition, 'color');
  const variables = get(entityDefinition, 'variables', {});
  const nodePropsA = { label: getLabel(entityDefinition, a), color };
  const nodePropsB = { label: getLabel(entityDefinition, b), color };
  const getVariableResolution = variable => get(resolvedAttributes, variable);
  const getVariableName = variable => get(variables, [variable, 'name']);

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
              <div className="entity-diff__table-heading-context" title={a[properties.nodePrimaryKey]}>
                {renderCaseID(get(a, properties.case))}
                <Node {...nodePropsA} />
              </div>
              <div className="entity-diff__table-heading-cell" title="Use all attributes from this node">
                <Radio
                  label="Use all attributes"
                  checked={isMatchType === 'LEFT'}
                  input={{ onChange: onSetLeft }}
                />
              </div>
            </td>
            <td className="entity-diff__table-heading" title={b[properties.nodePrimaryKey]}>
              <div className="entity-diff__table-heading-context">
                {renderCaseID(get(b, properties.case))}
                <Node {...nodePropsB} />
              </div>
              <div className="entity-diff__table-heading-cell" title="Use all attributes from this node">
                <Radio
                  label="Use all attributes"
                  checked={isMatchType === 'RIGHT'}
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
                  checked={isMatchType === 'MISMATCH'}
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
                  <VariableControl
                    value={values[0]}
                    selected={checked[0]}
                    onChange={() => onSetAttributes({ [variable]: 0 })}
                  />
                  <VariableControl
                    value={values[1]}
                    selected={checked[1]}
                    onChange={() => onSetAttributes({ [variable]: 1 })}
                  />
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
  [properties.nodePrimaryKey]: PropTypes.string.isRequired,
});

EntityDiff.propTypes = {
  match: PropTypes.shape({
    nodes: PropTypes.arrayOf(EntityPropTypes).isRequired,
    probability: PropTypes.number.isRequired,
    index: PropTypes.number.isRequired,
  }),
  entityDefinition: PropTypes.object,
  onChange: PropTypes.func,
  resolvedAttributes: PropTypes.object,
  action: PropTypes.object,
};

EntityDiff.defaultProps = {
  entityDefinition: null,
  match: null,
  onChange: null,
  resolvedAttributes: null,
  action: null,
};

const areEqual = (prevProps, props) => {
  const isIndexMatch = get(prevProps, 'match.index') === get(props, 'match.index');
  const isEntityDefinitionMatch = get(prevProps, 'entityDefinition.index') === get(props, 'entityDefinition.index');

  return isIndexMatch && isEntityDefinitionMatch;
};

export default React.memo(EntityDiff, areEqual);
