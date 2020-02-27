import React from 'react';
import { get } from 'lodash';
import { nodePrimaryKeyProperty, nodeAttributesProperty } from '../../../main/utils/formatters/network';

const renderNodeCell = node =>
  (<td title={`ID: ${get(node, nodePrimaryKeyProperty)}`}>{get(node, [nodeAttributesProperty, 'name'])}</td>);

const ReviewTable = (matches, actions) => (
  <div>
    <table>
      <thead>
        <tr>
          <th colSpan="2">Nodes</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {matches.map(
          ({ nodes }, index) => {
            // This is inefficient:
            const { action } = actions
              .find(r => r.index === index) || { action: null };
            return (
              <tr key={index}>
                {renderNodeCell(nodes[0])}
                {renderNodeCell(nodes[1])}
                <td>{action}</td>
              </tr>
            );
          }
        )}
      </tbody>
    </table>
  </div>
);

export default ReviewTable;
