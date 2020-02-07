import React from 'react';
import Radio from '../../ui/components/Fields/Radio';
// import DrawerTransition from '../ui/components/Transitions/Drawer';

const EntityDiff = ({ a, b }) => {
  const rows = Object.prototype.keys(a.attributes)
    .map(variable => ({ variable, values: { a: a[variable], b: b[variable] } }));

  return (
    <div>
      <table>
        {rows.map(({ variable, values }) => (
          <tr>
            <td>{ variable }</td>
            <td><Radio input={{}} /> { values.a }</td>
            <td><Radio input={{}} /> { values.b }</td>
          </tr>
        ))}
      </table>
    </div>
  );
};

export default EntityDiff;
