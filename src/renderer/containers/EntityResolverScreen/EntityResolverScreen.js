import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect, useDispatch } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { compose } from 'recompose';
import { AnimateSharedLayout } from 'framer-motion';
import { Button, Spinner } from '@codaco/ui';
import Types from '../../types';
import { selectors } from '../../ducks/modules/protocols';
import useResolutionsClient from '../../hooks/useResolutionsClient';
import Snapshots from './Snapshots';
import NewResolution from './NewResolution';

const EntityResolverScreen = ({
  protocolId,
  nodeTypes,
  protocolsHaveLoaded,
}) => {
  const dispatch = useDispatch();
  const [resolverOptions, setResolverOptions] = useState({});
  const [
    { resolutions, unresolved, egoCastType },
    { deleteResolution },
  ] = useResolutionsClient(protocolId);

  const handleSubmit = () => {};
  const canSubmit = true;

  if (protocolsHaveLoaded && !protocolId) { // This protocol doesn't exist
    return <Redirect to="/" />;
  }

  if (!protocolId) { // This protocol hasn't loaded yet
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
              <Snapshots
                protocolId={protocolId}
                nodeTypes={nodeTypes}
                resolutions={resolutions}
                onDeleteResolution={deleteResolution}
              />
            </div>
            <div className="export__section">
              <h3>2. Resolve Sessions</h3>
              <p>Use an external application to resolve nodes in a unified network.</p>
              <NewResolution
                unresolved={unresolved}
                nodeTypes={nodeTypes}
                egoCastType={egoCastType}
                options={resolverOptions}
                onUpdate={setResolverOptions}
              />
            </div>
          </AnimateSharedLayout>
          <div className="buttons">
            <Button type="submit" disabled={!canSubmit}>Begin Entity Resolution</Button>
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


const nodeDefinitionsAsOptions = (nodeDefinitions) => {
  const options = Object.keys(nodeDefinitions)
    .map(nodeType => ({
      label: nodeDefinitions[nodeType].name,
      value: nodeType,
    }));

  return options;
};

const mapStateToProps = (state, ownProps) => {
  const protocol = selectors.currentProtocol(state, ownProps);
  const nodeTypes = protocol
    ? nodeDefinitionsAsOptions(
      selectors.nodeDefinitions(state, protocol.id),
    )
    : [];

  return {
    protocolsHaveLoaded: selectors.protocolsHaveLoaded(state),
    protocolId: protocol && protocol.id,
    nodeTypes,
  };
};

const mapDispatchToProps = {
};

export {
  EntityResolverScreen,
};

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
)(EntityResolverScreen);
