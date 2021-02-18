import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { compose } from 'recompose';
import { AnimateSharedLayout, AnimatePresence, motion } from 'framer-motion';
import { Button, Spinner } from '@codaco/ui';
import logger from 'electron-log';
import Types from '../../types';
import { selectors as protocolSelectors } from '../../ducks/modules/protocols';
import EntityResolver from '../EntityResolver';
import Resolutions from './Resolutions';
import NewResolution from './NewResolution';
import useResolutionsClient from '../../hooks/useResolutionsClient';
import useExportManager from '../../hooks/useExportManager';

const defaultExportOptions = {
  exportGraphML: true,
  exportCSV: {
    adjacencyMatrix: false,
    attributeList: true,
    edgeList: true,
    egoAttributeList: true,
  },
  globalOptions: {
    unifyNetworks: false,
    useDirectedEdges: false,
    useScreenLayoutCoordinates: true,
    screenLayoutHeight: 1080,
    screenLayoutWidth: 1920,
  },
};

const EntityResolverScreen = ({
  protocolId,
  protocol,
  protocolsHaveLoaded,
}) => {
  const [
    { resolutions, unresolved, egoCastType },
    { saveResolution, deleteResolution },
  ] = useResolutionsClient(protocolId);

  const { exportToFile } = useExportManager();

  const [resolverOptions, setResolverOptions] = useState({});
  const resolver = useRef();

  const handleExportResolution = (resolutionId) => {
    exportToFile(
      protocol,
      {
        ...defaultExportOptions,
        resolutionId,
      },
    );
  };

  const handleSubmit = () => {
    resolver.current.resolveProtocol(protocol, resolverOptions)
      .catch(e => logger.error(e));
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
        ref={resolver}
        onSaveResolution={saveResolution}
        onComplete={handleExportResolution}
      />
      <form className="content export" onSubmit={handleSubmit}>
        <h1>Entity Resolver</h1>
        <div className="export__options">
          <AnimateSharedLayout>
            <AnimatePresence>
              { resolutions.length > 0 &&
                <motion.div
                  className="export__section"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <h3>Existing Snapshots</h3>
                  <p>Existing resolutions can be managed here.</p>
                  <p>
                    'Export' will create a resolved network based on the cases
                    that were available at that point in time. Later cases will be excluded.
                  </p>
                  <p>
                    You may expand each resolution to see more details about the settings
                    used to generate resolver matches.
                  </p>
                  <Resolutions
                    protocolId={protocolId}
                    resolutions={resolutions}
                    onExportResolution={handleExportResolution}
                    onDeleteResolution={deleteResolution}
                  />
                </motion.div>
              }
            </AnimatePresence>

            <div className="export__section">
              <h3>Resolve Sessions</h3>
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
