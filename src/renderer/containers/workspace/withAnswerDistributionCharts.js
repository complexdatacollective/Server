import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { get } from 'lodash';

import AdminApiClient from '../../utils/adminApiClient';
import { selectors as protocolSelectors } from '../../ducks/modules/protocols';
import { selectors as variableSelectors } from '../../ducks/modules/excludedChartVariables';
import Types from '../../types';

const { currentProtocolId, isDistributionVariable, currentCodebook } = protocolSelectors;
const { excludedVariablesForCurrentProtocol } = variableSelectors;

const hasData = (bucket) => bucket && Object.keys(bucket).length > 0;

/**
 * Translates the node variables and the data available for ordinal & categorical variables
 * into a series of chart definitions.
 *
 * One chart definition is produced for each ordinal & categorical variable. If session data
 * contains any answers for that variable, then the entire range of answers is returned (including
 * `0` values). If no data is available for a variable, then the chart contains an empty chartData
 * value, so the child component can easily render an empty data view.
 *
 * @private
 *
 * @param {Object} nodeCodebook `codebook.node`
 * @param {Object} buckets The API response from `option_buckets`
 * @return {Array} chartDefinitions
 */
const shapeBucketDataByType = (
  nodeCodebook, buckets, excludedChartVariables, entityKey,
) => Object.entries(nodeCodebook).reduce((acc, [entityType, { variables }]) => {
  const excludedSectionVariables = (excludedChartVariables[entityKey]
      && excludedChartVariables[entityKey][entityType]) || [];
  Object.keys(variables || []).forEach((variableName) => {
    const def = variables[variableName];
    if (!isDistributionVariable(def) || excludedSectionVariables.includes(variableName)) {
      return;
    }
    const dataPath = entityKey === 'ego' ? [variableName] : [entityType, variableName];
    const data = get(buckets, dataPath);
    const values = hasData(data) && def.options.map((option) => {
      // Option defs are usually in the format { label, value }, however:
      // - options may be strings or numerics instead of objects
      const isOptionObject = option && typeof option === 'object';
      // - label is optional, in which case `value` is used as the label
      const name = isOptionObject ? (option.label || option.value) : option;
      const dataKey = (isOptionObject ? option.value : option);
      return {
        name,
        value: data[dataKey] || 0,
      };
    });
    acc.push({
      entityKey,
      entityType: nodeCodebook[entityType].name,
      variableType: def.type,
      variableDefinition: def,
      chartData: values || [],
    });
  });
  return acc;
}, []);

const shapeBucketData = (
  codebook, buckets, excludedChartVariables,
) => Object.entries(buckets).reduce((acc, [entityKey]) => {
  const entityCodebook = entityKey === 'ego' ? { ego: codebook[entityKey] } : codebook[entityKey];
  const bucketsByType = buckets[entityKey];
  const shapeData = shapeBucketDataByType(
    entityCodebook, bucketsByType, excludedChartVariables, entityKey,
  );
  return acc.concat(shapeData);
}, []);

/**
 * HOC that provides chart definitions for the 'answer distribution' panels.
 * Charts are exposed as a prop so that panel components can be managed directly
 * (as an array) for sorting on the workspace before rendering.
 */
const withAnswerDistributionCharts = (WrappedComponent) => {
  /**
   * Renders a collection of ordinal & categorical distribution panels
   */
  const AnswerDistributionPanels = class extends Component {
    constructor(props) {
      super(props);
      this.state = {
        charts: [],
      };
      this.apiClient = new AdminApiClient();
    }

    componentDidMount() {
      this.loadData();
    }

    componentDidUpdate(prevProps) {
      const { totalSessionsCount: newCount, protocolId } = this.props;
      const prevCount = prevProps.totalSessionsCount;
      // When mounted (on each workspace load), totalSessionsCount is null.
      // Only reload data when session count changes (i.e., a session was
      // imported or deleted while on this workspace).
      if (newCount !== null && prevCount !== null && newCount !== prevCount) {
        this.loadData();
      } else if (prevProps.protocolId !== protocolId) {
        this.loadData();
      }
    }

    loadData() {
      const {
        excludedChartVariables,
        protocolId,
        codebook: {
          node: nodeCodebook = {},
          edge: edgeCodebook = {},
          ego: egoCodebook = {},
        },
      } = this.props;

      const nodeNames = Object.keys(nodeCodebook).reduce((acc, nodeType) => (
        {
          ...acc,
          [nodeType]: Object.keys(nodeCodebook[nodeType].variables || {}),
        }
      ), {});
      const edgeNames = Object.keys(edgeCodebook).reduce((acc, edgeType) => (
        {
          ...acc,
          [edgeType]: Object.keys(edgeCodebook[edgeType].variables || {}),
        }
      ), {});
      const egoNames = Object.keys(egoCodebook.variables || {});

      if (!protocolId) {
        return;
      }

      const variableNames = { nodes: nodeCodebook, edges: edgeCodebook, ego: egoCodebook };
      const route = `/protocols/${protocolId}/reports/option_buckets`;
      const query = { nodeNames, edgeNames, egoNames };

      this.apiClient.post(route, query)
        .then(({ buckets }) => {
          this.setState({
            charts: shapeBucketData(variableNames, buckets, excludedChartVariables),
          });
        });
    }

    render() {
      // eslint-disable-next-line react/jsx-props-no-spreading, react/destructuring-assignment
      return <WrappedComponent {...this.props} answerDistributionCharts={this.state.charts} />;
    }
  };

  AnswerDistributionPanels.propTypes = {
    excludedChartVariables: PropTypes.object,
    protocolId: PropTypes.string,
    totalSessionsCount: PropTypes.number,
    codebook: Types.codebook.isRequired,
  };

  AnswerDistributionPanels.defaultProps = {
    excludedChartVariables: {},
    protocolId: null,
    totalSessionsCount: null,
  };

  const mapStateToProps = (state, ownProps) => ({
    excludedChartVariables: excludedVariablesForCurrentProtocol(state, ownProps),
    protocolId: currentProtocolId(state, ownProps),
    codebook: currentCodebook(state, ownProps),
  });

  return connect(mapStateToProps)(AnswerDistributionPanels);
};

export default withAnswerDistributionCharts;
