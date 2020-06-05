import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { nodePrimaryKeyProperty, nodeAttributesProperty } from '%main/utils/formatters/network';
import './ReviewTable.scss';

const renderNodeCell = node =>
  (<td title={`ID: ${get(node, nodePrimaryKeyProperty)}`}>{get(node, [nodeAttributesProperty, 'name'])}</td>);

const ReviewTable = ({
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
              {renderNodeCell(nodes[0])}
              {renderNodeCell(nodes[1])}
              <td>{action}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

ReviewTable.propTypes = {
  matches: PropTypes.array,
  actions: PropTypes.array,
};

ReviewTable.defaultProps = {
  matches: [],
  actions: [],
};

export default ReviewTable;
