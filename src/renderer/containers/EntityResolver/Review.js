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
      <div className="review__summary">
        <p>Below is a summary of your resolution actions.</p>
      </div>

      <table className="review__stats">
        <tbody>
          <tr>
            <td>{matches.length}</td>
            <th>
              <h4>Total matches found</h4>
              <p>Number of pairs returned by your script</p>
            </th>
          </tr>
          <tr>
            <td>{resolvedCount}</td>
            <th>
              <h4>Resolved pairs</h4>
              <p>Number of pairs you indicated were valid matches</p>
            </th>
          </tr>
          <tr>
            <td>{skipCount}</td>
            <th>
              <h4>Skipped pairs</h4>
              <p>Number of pairs you indicated were not matches</p>
            </th>
          </tr>
          <tr title="If NODE_A = NODE_B and NODE_C=NODE_B then NODE_A=NODE_C">
            <td>{implicitCount}</td>
            <th>
              <h4>Inferred pairs</h4>
              <p>Number of pairs that were resolved automatically by transitive relation.</p>
            </th>
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
