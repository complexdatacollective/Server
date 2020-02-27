import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { isEqual, isNil, reduce, get } from 'lodash';
import { Button } from '@codaco/ui';
import Radio from '@codaco/ui/lib/components/Fields/Radio';
import useEntityState from './useEntityState';
import './EntityDiff.scss';

const formatVariable = variable =>
  (isNil(variable) ? 'not set' : variable.toString());

const EntityDiff = ({
  match,
  onResolve,
}) => {
  const [
    { resolvedAttributes, showHidden },
    { set: setAttributes, reset, toggleHidden },
  ] = useEntityState();

  if (!match) { return null; }

  const [a, b] = match.nodes;

  const requiredAttributes = Object.keys(a.attributes)
    .filter(variable => a.attributes[variable] !== b.attributes[variable] || variable === 'name');

  const getVariableResolution = variable => get(resolvedAttributes, variable);

  const handleResolve = useCallback(
    () => {
      const isComplete = isEqual(requiredAttributes, Object.keys(resolvedAttributes));

      // TODO: set error state
      if (!isComplete) { return; }

      const resolved = reduce(resolvedAttributes, (obj, resolution, variable) => ({
        ...obj,
        [variable]: match.nodes[resolution].attributes[variable],
      }), {});

      const fullResolvedAttributes = {
        ...match.nodes[0].attributes, // include values we filtered out (ones that were equal)
        ...resolved,
      };

      onResolve(match, 'resolve', fullResolvedAttributes);
      reset();
    },
    [onResolve, resolvedAttributes, reset, match],
  );

  const handleSkip = useCallback(() => {
    if (!(
      Object.keys(resolvedAttributes).length === 0 ||
      window.confirm('Looks like you have set attributes, are you sure?')
    )) {
      return;
    }

    onResolve(match, 'skip');
    reset();
  }, [onResolve, reset]);

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

  return (
    <div key={match.index} className="entity-diff">
      <table className="entity-diff__table">
        <thead>
          <tr>
            <th>Variable</th>
            <th className="entity-diff__table-clickable">
              <Radio
                label="A"
                checked={allChecked[0]}
                input={{
                  onChange: () => setAttributes(
                    requiredAttributes.reduce((acc, attribute) => ({ ...acc, [attribute]: 0 }), {}),
                  ),
                }}
              />
            </th>
            <th className="entity-diff__table-clickable">
              <Radio
                label="B"
                checked={allChecked[1]}
                input={{
                  onChange: () => setAttributes(
                    requiredAttributes.reduce((acc, attribute) => ({ ...acc, [attribute]: 1 }), {}),
                  ),
                }}
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {rows
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
              </tr>
            ))}
          { !showHidden &&
            <tr>
              <td colSpan="3" className="entity-diff__table-hidden-count">
                <Button onClick={toggleHidden} size="small" color="platinum">
                  {rows.filter(({ required }) => !required).length} hidden matching rows...
                </Button>
              </td>
            </tr>
          }
          {showHidden && rows
            .filter(({ required }) => !required)
            .map(({ variable, values, checked }) => (
              <tr key={`${match.index}_${variable}`}>
                <th>{ variable }</th>
                <td>
                  {formatVariable(values[0])}
                </td>
                <td>
                  {formatVariable(values[1])}
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      <div className="entity-diff__controls">
        <Button color="white" onClick={handleSkip}>Skip</Button>
        <Button onClick={handleResolve}>Resolve</Button>
      </div>
    </div>
  );
};

const EntityPropTypes = PropTypes.shape({
  attributes: PropTypes.object.isRequired,
  id: PropTypes.string.isRequired,
});

EntityDiff.propTypes = {
  match: PropTypes.shape({
    nodes: PropTypes.arrayOf(EntityPropTypes).isRequired,
    prob: PropTypes.number.isRequired,
    index: PropTypes.number.isRequired,
  }),
  onResolve: PropTypes.func.isRequired,
};

EntityDiff.defaultProps = {
  match: null,
};

export default EntityDiff;
