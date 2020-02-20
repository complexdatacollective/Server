import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { isEqual } from 'lodash';
import Radio from '@codaco/ui/lib/components/Fields/Radio';
import useEntityState from './useEntityState';

const EntityDiff = ({
  match,
  onResolve,
}) => {
  const [resolvedAttributes, setAttributes, resetAttributes] = useEntityState();

  if (!match) { return null; }

  const [a, b] = match.nodes;

  const rows = Object.keys(a.attributes)
    // remove matching values
    .filter(variable => a.attributes[variable] !== b.attributes[variable])
    .map(variable => ({
      variable,
      values: [
        a.attributes[variable],
        b.attributes[variable],
      ],
      displayValues: [
        a.attributes[variable] ? a.attributes[variable].toString() : 'undefined',
        b.attributes[variable] ? b.attributes[variable].toString() : 'undefined',
      ],
      checked: [
        resolvedAttributes[variable] && resolvedAttributes[variable] === a.attributes[variable],
        resolvedAttributes[variable] && resolvedAttributes[variable] === b.attributes[variable],
      ],
    }));

  const allChecked = [
    isEqual(a.attributes, resolvedAttributes),
    isEqual(b.attributes, resolvedAttributes),
  ];

  const handleResolve = useCallback(
    () => {
      const fullResolvedAttributes = {
        ...match.nodes[0], // include values we filtered out (ones that were equal)
        ...resolvedAttributes,
      };
      onResolve(match, 'resolve', fullResolvedAttributes);
      resetAttributes();
    },
    [onResolve, resolvedAttributes, resetAttributes, match],
  );

  const handleSkip = useCallback(() => onResolve(match, 'skip'));

  return (
    <div key={match.index}>
      <table>
        <thead>
          <tr>
            <th>Variable</th>
            <th>
              <Radio
                label="A"
                checked={allChecked[0]}
                input={{
                  onChange: () => setAttributes(match.nodes[0].attributes),
                }}
              />
            </th>
            <th>
              <Radio
                label="B"
                checked={allChecked[1]}
                input={{
                  onChange: () => setAttributes(match.nodes[1].attributes),
                }}
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ variable, values, displayValues, checked }) => (
            <tr>
              <td>{ variable }</td>
              <td>
                <Radio
                  label={displayValues[0]}
                  checked={checked[0]}
                  input={{
                    onChange: () => setAttributes({ [variable]: values[0] }),
                  }}
                />
              </td>
              <td>
                <Radio
                  label={displayValues[1]}
                  checked={checked[1]}
                  input={{
                    onChange: () => setAttributes({ [variable]: values[1] }),
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
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
