import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect, useDispatch } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { compose } from 'recompose';
import { AnimateSharedLayout } from 'framer-motion';
import { Button, Spinner } from '@codaco/ui';
import Types from '../../types';
import { selectors } from '../../ducks/modules/protocols';
import Snapshots from './Snapshots';
import NewResolution from './NewResolution';

const EntityResolverScreen = ({
  protocol,
  protocolsHaveLoaded,
}) => {
  const dispatch = useDispatch();
  const [resolverOptions, setResolverOptions] = useState({});

  const handleSubmit = () => {};
  const canSubmit = true;

  if (protocolsHaveLoaded && !protocol) { // This protocol doesn't exist
    return <Redirect to="/" />;
  }

  if (!protocol) { // This protocol hasn't loaded yet
    return <div className="export--loading"><Spinner /></div>;
  }

  return (
    <React.Fragment>
      <form className="content export" onSubmit={handleSubmit}>
        <h1>Entity Resolver</h1>
        <div className="export__options">
          <AnimateSharedLayout>
            <div className="export__section">
              <h3>1. Existing Snapshots</h3>
              <p>Manage existing resolutions.</p>
              <Snapshots />
            </div>
            <div className="export__section">
              <h3>2. Resolve Sessions</h3>
              <p>Use an external application to resolve nodes in a unified network.</p>
              <NewResolution
                protocolId={protocol.id}
                onUpdate={setResolverOptions}
              />
            </div>
          </AnimateSharedLayout>
          <div className="buttons">
            <Button type="submit" disabled={!canSubmit}>Begin Entity Resolution</Button>
            <Button type="submit" disabled={!canSubmit}>Begin Export</Button>
          </div>
        </div>
      </form>
    </React.Fragment>
  );
};

EntityResolverScreen.propTypes = {
  protocol: Types.protocol,
  protocolsHaveLoaded: PropTypes.bool.isRequired,
};

EntityResolverScreen.defaultProps = {
  protocol: null,
};

const mapStateToProps = (state, ownProps) => ({
  protocolsHaveLoaded: selectors.protocolsHaveLoaded(state),
  protocol: selectors.currentProtocol(state, ownProps),
});

const mapDispatchToProps = {
};

export {
  EntityResolverScreen,
};

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
)(EntityResolverScreen);
