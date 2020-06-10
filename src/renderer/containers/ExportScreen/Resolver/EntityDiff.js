import React, { forwardRef, useImperativeHandle } from 'react';
import PropTypes from 'prop-types';
import { isEqual, isNil, reduce, get } from 'lodash';
import { Button, Node } from '@codaco/ui';
import Radio from '@codaco/ui/lib/components/Fields/Radio';
import { nodePrimaryKeyProperty } from '%main/utils/formatters/network';
import { getNodeTypeDefinition, getLabel } from './selectors';
import useEntityState from './useEntityState';
import './EntityDiff.scss';

const formatVariable = variable =>
  (isNil(variable) ? 'not set' : variable.toString());

const EntityDiff = ({
  match,
  onResolve,
  onSkip,
  onBack,
  codebook,
}, ref) => {
  const [
    { resolvedAttributes, showHidden, isMatch, isTouched },
    { set: setAttributes, reset, toggleHidden, setNoMatch },
  ] = useEntityState();

  if (!match) { return null; }

  const [a, b] = match.nodes;

  const requiredAttributes = Object.keys(a.attributes)
    .filter(variable => a.attributes[variable] !== b.attributes[variable] || variable === 'name');

  const { color, variables } = getNodeTypeDefinition(codebook, a);
  const nodePropsA = { label: getLabel(codebook, a), color };
  const nodePropsB = { label: getLabel(codebook, b), color };

  const getVariableResolution = variable => get(resolvedAttributes, variable);
  const getVariableName = variable => variables[variable].name;

  const isComplete = isEqual(requiredAttributes, Object.keys(resolvedAttributes));
  const isReady = isComplete && ((isMatch && isComplete) || !isMatch);

  useImperativeHandle(ref, () => ({
    onBack: () => {
      if (!(
        !isTouched ||
        window.confirm('Looks like you have set some attributes, are you sure?') // eslint-disable-line
      )) {
        return;
      }

      onBack();
    },
    isReady: () => isReady,
    onNext: () => {
      if (!isTouched) {
        return;
      }

      if (isMatch) {
        // TODO: set error state
        if (!isComplete) {
          window.alert("Looks like you haven't chosen all the attributes yet?") // eslint-disable-line
          return;
        }

        const resolved = reduce(resolvedAttributes, (obj, resolution, variable) => ({
          ...obj,
          [variable]: match.nodes[resolution].attributes[variable],
        }), {});

        const fullResolvedAttributes = {
          ...match.nodes[0].attributes, // include values we filtered out (ones that were equal)
          ...resolved,
        };

        onResolve(match, fullResolvedAttributes);
        reset();
        return;
      }

      // if !isMatch
      onSkip(match);
      reset();
    },
  }), [onResolve, resolvedAttributes, reset, match, isTouched, isMatch]);

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

  return (
    <div key={match.index} className="entity-diff">
      <table className="entity-diff__table">
        <thead>
          <tr>
            <div className="entity-diff__table-heading">
              <div className="entity-diff__table-heading-context">
                {(match.probability * 100).toFixed(0)}% match
              </div>
              <div className="entity-diff__table-heading-fill" />
            </div>
            <div className="entity-diff__table-heading">
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
            </div>
            <div className="entity-diff__table-heading">
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
            </div>
            <div className="entity-diff__table-heading">
              <div className="entity-diff__table-heading-context">
                <div className="entity-diff__node-stack">
                  <Node {...nodePropsA} />
                  <Node {...nodePropsB} />
                </div>
              </div>
              <div className="entity-diff__table-heading-cell">
                <Radio
                  label="Not a match"
                  checked={isMatch === false}
                  input={{
                    onChange: () => setNoMatch(),
                  }}
                />
              </div>
            </div>
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
              <th>
                <Button onClick={toggleHidden} size="small" color="platinum">
                  {rows.filter(({ required }) => !required).length} matching rows...
                </Button>
              </th>
              <td colSpan="3" className="wide" />
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
  onResolve: PropTypes.func.isRequired,
  onSkip: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
};

EntityDiff.defaultProps = {
  match: null,
  codebook: null,
};

export default forwardRef(EntityDiff);
