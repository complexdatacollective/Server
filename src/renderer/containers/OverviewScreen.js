import React from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';

import { Instructions } from '../components';
import Types from '../types';

const OverviewScreen = ({ protocols }) => {
  if (protocols && protocols.length) {
    return <Redirect to={`/workspaces/${protocols[0].id}`} />;
  }

  return <Instructions />;
};

OverviewScreen.defaultProps = {
  protocols: null,
};

OverviewScreen.propTypes = {
  protocols: Types.protocols,
};

const mapStateToProps = reduxState => ({
  protocols: reduxState.protocols,
});

export default connect(mapStateToProps)(OverviewScreen);

export { OverviewScreen as UnconnectedOverviewScreen };
