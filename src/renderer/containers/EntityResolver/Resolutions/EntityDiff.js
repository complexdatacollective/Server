import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { isNil, get } from 'lodash';
import { Button, Node } from '@codaco/ui';
import Radio from '@codaco/ui/lib/components/Fields/Radio';
import { nodePrimaryKeyProperty } from '%main/utils/formatters/network';
import { getNodeTypeDefinition, getLabel, getMatchId } from './selectors';
import './EntityDiff.scss';

const formatVariable = variable =>
  (isNil(variable) ? 'not set' : variable.toString());

const EntityDiff = ({
  codebook,
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

  const nodeDefinition = getNodeTypeDefinition(codebook, a);
  const color = get(nodeDefinition, 'color');
  const variables = get(nodeDefinition, 'variables');
  const nodePropsA = { label: getLabel(codebook, a), color };
  const nodePropsB = { label: getLabel(codebook, b), color };
  const getVariableResolution = variable => get(resolvedAttributes, variable);
  const getVariableName = variable => get(variables, [variable, 'name']);

  const rows = Object.keys(a.attributes)
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
    <div key={match.index} className="entity-diff">
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
  codebook: PropTypes.object,
  requiredAttributes: PropTypes.array,
  resolvedAttributes: PropTypes.object,
  setAttributes: PropTypes.func.isRequired,
  setNotAMatch: PropTypes.func.isRequired,
  isAMatch: PropTypes.bool,
};

EntityDiff.defaultProps = {
  match: null,
  codebook: null,
  isAMatch: false,
  requiredAttributes: [],
  resolvedAttributes: {},
};

export default EntityDiff;
