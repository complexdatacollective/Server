import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { nodePrimaryKeyProperty } from '%main/utils/formatters/network';
import { getLabel } from './selectors';
import './ReviewTable.scss';

const renderNodeCell = (nodeTypeDefinition, node) =>
  (<td title={get(node, nodePrimaryKeyProperty)}>{getLabel(nodeTypeDefinition, node)}</td>);

const ReviewTable = ({
  nodeTypeDefinition,
  matches,
  actions,
}) => (
  <div className="review-table">
    <table className="review-table__table">
      <thead>
        <tr>
          <th colSpan="2">Nodes</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {matches.map(({ nodes }, index) => {
          // This is inefficient:
          const { action } = actions
            .find(r => r.index === index) || { action: null };

          return (
            <tr key={index}>
              {renderNodeCell(nodeTypeDefinition, nodes[0])}
              {renderNodeCell(nodeTypeDefinition, nodes[1])}
              <td>{action}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

ReviewTable.propTypes = {
  nodeTypeDefinition: PropTypes.object,
  matches: PropTypes.array,
  actions: PropTypes.array,
};

ReviewTable.defaultProps = {
  nodeTypeDefinition: {},
  matches: [],
  actions: [],
};

export default ReviewTable;
