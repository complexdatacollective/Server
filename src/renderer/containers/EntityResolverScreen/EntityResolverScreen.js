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
import Tip from '../../components/Tip';
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
        <div className="export__section">
          <h3>Introduction</h3>
          <p>
            Entity resolution allows you to find pairs of nodes (and egos) across different sessions
            that represent the same person, place or object. You can then export the resulting
            &quot;resolved&quot; nodes as a single combined network.
          </p>
          <p>
            This feature is facilitated by sending a list of nodes to your script (typically written
            in Python), which will returns a list of pairs with scores of the probability of
            matching.
          </p>
        </div>
        <div className="export__options">
          <AnimateSharedLayout>
            <AnimatePresence>
              { resolutions.length > 0 &&
                <motion.div
                  className="export__section"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <h3>Existing Resolutions</h3>
                  <p>Existing resolutions can be review, exported and deleted here.</p>
                  <p>
                    <em>Export</em> will create a resolved network based on the cases
                    that were available at that point in time. Later cases will be excluded.
                  </p>
                  <p>
                    You may expand each resolution to see more details about the settings
                    used to generate resolver matches, or to delete the resolution.
                  </p>
                  <p>
                    Because resolutions are cumulative, if you delete an earlier resolution,
                    all subsequent resolutions will also be removed.
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
              <h3>
                Resolve Sessions
              </h3>
              <p>
                Create a new resolution using an external script to score nodes
                according to their similarity. For example, you could use a fuzzy
                matching algorithm to compare the name fields.
              </p>
              <p>
                Resolutions are cumulative, meaning that the node list sent
                to your script will have <em>earlier resolutions</em> applied,
                with any nodes added since remaining unchanged. If you would prefer
                to resolve all nodes from scratch, you will first need to delete any
                earlier resolutions.
              </p>

              <Tip>
                {unresolved} new session{unresolved === 1 ? '' : 's'} to resolve
              </Tip>

              <NewResolution
                protocolId={protocolId}
                onUpdate={setResolverOptions}
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
