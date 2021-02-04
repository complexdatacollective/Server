import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { compose } from 'recompose';
import { AnimateSharedLayout } from 'framer-motion';
import { Button, Spinner } from '@codaco/ui';
import Types from '../../types';
import { selectors as protocolSelectors } from '../../ducks/modules/protocols';
import EntityResolver from '../EntityResolver';
import Resolutions from './Resolutions';
import NewResolution from './NewResolution';
import useResolutionsClient from '../../hooks/useResolutionsClient';

const EntityResolverScreen = ({
  protocolId,
  protocol,
  protocolsHaveLoaded,
}) => {
  const [
    { resolutions, unresolved, egoCastType },
    { saveResolution, deleteResolution },
  ] = useResolutionsClient(protocolId);

  const [resolverOptions, setResolverOptions] = useState({});
  const resolver = useRef();

  const handleSubmit = () => {
    resolver.current.resolveProtocol(protocol, resolverOptions);
  };

  if (protocolsHaveLoaded && !protocolId) { // This protocol doesn't exist
    return <Redirect to="/" />;
  }

  if (!protocolId) { // This protocol hasn't loaded yet
    return <div className="export--loading"><Spinner /></div>;
  }

  return (
    <React.Fragment>
      <EntityResolver
        onComplete={console.log}
        ref={resolver}
        onSaveResolution={saveResolution}
      />
      <form className="content export" onSubmit={handleSubmit}>
        <h1>Entity Resolver</h1>
        <div className="export__options">
          <AnimateSharedLayout>
            <div className="export__section">
              <h3>1. Existing Snapshots</h3>
              <p>Manage existing resolutions.</p>
              <Resolutions
                protocolId={protocolId}
                resolutions={resolutions}
                onDeleteResolution={deleteResolution}
              />
            </div>
            <div className="export__section">
              <h3>2. Resolve Sessions</h3>
              <p>Use an external application to resolve nodes in a unified network.</p>
              <NewResolution
                protocolId={protocolId}
                onUpdate={setResolverOptions}
                unresolved={unresolved}
                egoCastType={egoCastType}
              />
            </div>
          </AnimateSharedLayout>
          <div className="buttons">
            <Button type="submit">Begin Entity Resolution</Button>
          </div>
        </div>
      </form>
    </React.Fragment>
  );
};

EntityResolverScreen.propTypes = {
  protocolId: PropTypes.string,
  protocol: Types.protocol,
  protocolsHaveLoaded: PropTypes.bool.isRequired,
};

EntityResolverScreen.defaultProps = {
  protocol: null,
  protocolId: null,
};

const mapStateToProps = (state, ownProps) => {
  const protocol = protocolSelectors.currentProtocol(state, ownProps);

  return {
    protocolsHaveLoaded: protocolSelectors.protocolsHaveLoaded(state),
    protocol,
    protocolId: protocol && protocol.id,
  };
};

export {
  EntityResolverScreen,
};

export default compose(
  connect(mapStateToProps, {}),
)(EntityResolverScreen);
