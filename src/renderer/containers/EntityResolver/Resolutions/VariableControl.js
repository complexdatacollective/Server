import React from 'react';
import { isNil, isPlainObject } from 'lodash';
import PropTypes from 'prop-types';
import Radio from '@codaco/ui/lib/components/Fields/Radio';

export const formatVariable = (variable) => {
  if (isNil(variable)) { return 'not set'; }
  if (isPlainObject(variable)) {
    return Object.keys(variable)
      .map(key => (
        <div key={key}>{key}: {variable[key]}</div>
      ));
  }
  return variable.toString();
};

const Variable = ({ value, selected, onChange }) => (
  <td>
    { isNil(value) ?
      formatVariable(value) :
      <Radio
        label={formatVariable(value)}
        checked={selected}
        input={{ onChange }}
      />
    }
  </td>
);

Variable.propTypes = {
  value: PropTypes.any,
  selected: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
};

Variable.defaultProps = {
  value: null,
};

export default Variable;
