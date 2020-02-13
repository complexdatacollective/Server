import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { isEqual } from 'lodash';
import Radio from '@codaco/ui/lib/components/Fields/Radio';
import useEntityState from './useEntityState';

const EntityDiff = ({
  match,
  onResolve,
  onNext,
  onPrevious,
}) => {
  const [resolvedEntity, handleSet, handleSetAll] = useEntityState();

  if (!match) { return null; }

  const {
    a: entityA,
    b: entityB,
  } = match;

  const rows = Object.keys(entityA.attributes)
    .map(variable => ({
      variable,
      values: {
        a: entityA.attributes[variable],
        b: entityB.attributes[variable],
      },
      checked: {
        a: resolvedEntity[variable] && resolvedEntity[variable] === entityA.attributes[variable],
        b: resolvedEntity[variable] && resolvedEntity[variable] === entityB.attributes[variable],
      },
    }));

  const allChecked = {
    a: isEqual(entityA.attributes, resolvedEntity),
    b: isEqual(entityB.attributes, resolvedEntity),
  };

  const handleResolve = useCallback(
    () => onResolve(match, 'resolve', resolvedEntity),
    [resolvedEntity],
  );

  const handleSkip = useCallback(() => onResolve(match, 'skip'));

  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>Variable</th>
            <th>
              <Radio
                label="A"
                checked={allChecked.a}
                input={{
                  onChange: () => handleSetAll(entityA.attributes),
                }}
              />
            </th>
            <th>
              <Radio
                label="B"
                checked={allChecked.b}
                input={{
                  onChange: () => handleSetAll(entityB.attributes),
                }}
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ variable, values, checked }) => (
            <tr>
              <td>{ variable }</td>
              <td>
                <Radio
                  label={values.a}
                  checked={checked.a}
                  input={{
                    onChange: () => handleSet(variable, values.a),
                  }}
                />
              </td>
              <td>
                <Radio
                  label={values.b}
                  checked={checked.b}
                  input={{
                    onChange: () => handleSet(variable, values.b),
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        {/* <button type="button" onClick={onPrevious}>Previous</button> */}
        <button type="button" onClick={handleSkip}>Skip</button>
        <button type="button" onClick={handleResolve}>Resolve</button>
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
    a: EntityPropTypes.isRequired,
    b: EntityPropTypes.isRequired,
    prob: PropTypes.number.isRequired,
    index: PropTypes.number.isRequired,
  }),
  onResolve: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  onPrevious: PropTypes.func.isRequired,
};

EntityDiff.defaultProps = {
  match: null,
};

export default EntityDiff;
