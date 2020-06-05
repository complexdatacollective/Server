import React, { forwardRef, useImperativeHandle } from 'react';
import PropTypes from 'prop-types';
import { isEqual, isNil, reduce, get } from 'lodash';
import { Button, Node } from '@codaco/ui';
import Radio from '@codaco/ui/lib/components/Fields/Radio';
import { nodePrimaryKeyProperty } from '%main/utils/formatters/network';
import useEntityState from './useEntityState';
import './EntityDiff.scss';

const formatVariable = variable =>
  (isNil(variable) ? 'not set' : variable.toString());

const EntityDiff = ({
  match,
  onResolve,
  onSkip,
  onBack,
}, ref) => {
  const [
    { resolvedAttributes, showHidden, isMatch, isTouched },
    { set: setAttributes, reset, toggleHidden, setNoMatch },
  ] = useEntityState();

  if (!match) { return null; }

  const [a, b] = match.nodes;

  const requiredAttributes = Object.keys(a.attributes)
    .filter(variable => a.attributes[variable] !== b.attributes[variable] || variable === 'name');

  const getVariableResolution = variable => get(resolvedAttributes, variable);

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
    onNext: () => {
      if (!isTouched) {
        return;
      }

      if (isMatch) {
        const isComplete = isEqual(requiredAttributes, Object.keys(resolvedAttributes));

        // TODO: set error state
        if (!isComplete) {
          window.confirm("Looks like you haven't chosen all the attributes yet?") // eslint-disable-line
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
                <Node />
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
                <Node />
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
                  <Node />
                  <Node />
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
                  <th>{ variable }</th>
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
                <th>{ variable }</th>
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
                  {rows.filter(({ required }) => !required).length} hidden matching rows...
                </Button>
              </th>
              <td colSpan="3" />
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
  onResolve: PropTypes.func.isRequired,
  onSkip: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
};

EntityDiff.defaultProps = {
  match: null,
};

export default forwardRef(EntityDiff);
