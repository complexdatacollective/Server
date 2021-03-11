import React from 'react';

const NoResults = () => (
  <React.Fragment>
    <p>The entity resolution script did not return any results.</p>
    <p>To continue with export, please close this window and either select
      a previous resolution or uncheck &quot;entity resolution&quot;</p>
  </React.Fragment>
);

export default NoResults;
