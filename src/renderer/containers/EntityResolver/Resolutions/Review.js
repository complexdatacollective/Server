import React from 'react';
import PropTypes from 'prop-types';
import './Review.scss';

const Review = ({
  matches,
  actions,
}) => (
  <div className="review">
    Total matches: {matches.length}
    Resolved: {actions.filter(({ action }) => action === 'match').length}
    Skipped: {actions.filter(({ action }) => action === 'skip').length}
  </div>
);

Review.propTypes = {
  matches: PropTypes.array,
  actions: PropTypes.array,
};

Review.defaultProps = {
  matches: [],
  actions: [],
};

export default Review;
