import React from 'react';

const NoResults = () => (
  <React.Fragment>
    <p>The entity resolution script did not return any results.</p>
    <p>This does not necessarily indicate a failure, it may be that
      no matching nodes were found by the script.</p>
  </React.Fragment>
);

export default NoResults;
