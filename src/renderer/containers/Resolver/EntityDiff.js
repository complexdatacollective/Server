import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { isEqual, isNil } from 'lodash';
import Radio from '@codaco/ui/lib/components/Fields/Radio';
import useEntityState from './useEntityState';

const formatVariable = variable =>
  (isNil(variable) ? 'not set' : variable.toString());

const EntityDiff = ({
  match,
  onResolve,
}) => {
  const [resolvedAttributes, setAttributes, resetAttributes] = useEntityState();

  if (!match) { return null; }

  const [a, b] = match.nodes;

  const rows = Object.keys(a.attributes)
    .map(variable => ({
      variable,
      notSet: isNil(a.attributes[variable]) && isNil(b.attributes[variable]),
      matching: a.attributes[variable] === b.attributes[variable],
      values: [
        a.attributes[variable],
        b.attributes[variable],
      ],
      checked: [
        Object.prototype.hasOwnProperty.call(resolvedAttributes, variable) && resolvedAttributes[variable] === a.attributes[variable],
        Object.prototype.hasOwnProperty.call(resolvedAttributes, variable) && resolvedAttributes[variable] === b.attributes[variable],
      ],
    }));

  const allChecked = [
    isEqual(a.attributes, resolvedAttributes),
    isEqual(b.attributes, resolvedAttributes),
  ];

  const handleResolve = useCallback(
    () => {
      const fullResolvedAttributes = {
        ...match.nodes[0].attributes, // include values we filtered out (ones that were equal)
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
          {rows
            // hide rows that match, except 'name'
            .filter(
              ({ matching, variable }) =>
                !matching || variable === 'name',
            )
            .map(({ variable, values, checked }) => (
              <tr>
                <td>{ variable }</td>
                <td>
                  <Radio
                    label={formatVariable(values[0])}
                    checked={checked[0]}
                    input={{
                      onChange: () => setAttributes({ [variable]: values[0] }),
                    }}
                  />
                </td>
                <td>
                  <Radio
                    label={formatVariable(values[1])}
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
        <p>{rows.filter(({ matching }) => matching).length} matching rows auto merged.</p>
      </div>

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
