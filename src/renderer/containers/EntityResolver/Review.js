import React from 'react';
import PropTypes from 'prop-types';
import './Review.scss';

const Review = ({
  matches,
  actions,
}) => {
  const resolvedCount = actions.filter(({ action }) => action === 'match').length;
  const skipCount = actions.filter(({ action }) => action === 'skip').length;
  const implicitCount = actions.filter(({ action }) => action === 'implicit').length;

  return (
    <div className="review">
      <table className="review__stats">
        <tbody>
          <tr>
            <th>Total matches</th>
            <td>{matches.length}</td>
          </tr>
          <tr>
            <th>Resolved</th>
            <td>{resolvedCount}</td>
          </tr>
          <tr>
            <th>Implicit</th>
            <td>{implicitCount}</td>
          </tr>
          <tr>
            <th>Skipped</th>
            <td>{skipCount}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

Review.propTypes = {
  matches: PropTypes.array,
  actions: PropTypes.array,
};

Review.defaultProps = {
  matches: [],
  actions: [],
};

export default Review;
