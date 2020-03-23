import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { Button } from '@codaco/ui';
import { nodePrimaryKeyProperty, nodeAttributesProperty } from '%main/utils/formatters/network';
import './ReviewTable.scss';

const renderNodeCell = node =>
  (<td title={`ID: ${get(node, nodePrimaryKeyProperty)}`}>{get(node, [nodeAttributesProperty, 'name'])}</td>);

const ReviewTable = ({
  matches,
  actions,
  onConfirm,
  onCancel,
}) => {
  const [{ disabled }, setState] = useState({ disabled: false });

  const handleConfirm = () => {
    setState({ disabled: true });
    onConfirm();
  };

  return (
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

      <div className="review-table__controls">
        <Button disabled={disabled} onClick={onCancel} color="white">Cancel all</Button>
        <Button disabled={disabled} onClick={handleConfirm}>Save and export</Button>
      </div>
    </div>
  );
};

ReviewTable.propTypes = {
  matches: PropTypes.array,
  actions: PropTypes.array,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

ReviewTable.defaultProps = {
  matches: [],
  actions: [],
};

export default ReviewTable;
