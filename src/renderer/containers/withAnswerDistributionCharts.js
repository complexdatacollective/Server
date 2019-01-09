import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import AdminApiClient from '../utils/adminApiClient';
import { selectors as protocolSelectors } from '../ducks/modules/protocols';
import { selectors as variableSelectors } from '../ducks/modules/excludedChartVariables';
import Types from '../types';

const { currentProtocolId, isDistributionVariable, transposedRegistry } = protocolSelectors;
const { excludedVariablesForCurrentProtocol } = variableSelectors;

const hasData = bucket => bucket && Object.keys(bucket).length > 0;

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
 * @param {Object} transposedNodeRegistry `transposedRegistry.node`, with transposed names
 * @param {Object} buckets The API response from `option_buckets`
 * @return {Array} chartDefinitions
 */
const shapeBucketData = (transposedNodeRegistry, buckets, excludedChartVariables) =>
  Object.entries(transposedNodeRegistry).reduce((acc, [entityType, { variables }]) => {
    const excludedSectionVariables = excludedChartVariables[entityType] || [];
    Object.entries(variables).forEach(([variableName, def]) => {
      if (!isDistributionVariable(def) || excludedSectionVariables.includes(def.name)) {
        return;
      }
      const data = buckets[entityType] && buckets[entityType][variableName];
      const values = hasData(data) && def.options.map((option) => {
        // Option defs are usually in the format { label, value }, however:
        // - options may be strings or numerics instead of objects
        const isOptionObject = option && typeof option === 'object';
        // - label is optional, in which case `value` is used as the label
        const name = isOptionObject ? (option.label || option.value) : option;
        const dataKey = (isOptionObject ? option.value : option).toString();
        return {
          name,
          value: data[dataKey] || 0,
        };
      });
      acc.push({
        entityType,
        variableType: def.type,
        variableDefinition: def,
        chartData: values || [],
      });
    });
    return acc;
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
    static defaultProps = {
      excludedChartVariables: {},
      protocolId: null,
      totalSessionsCount: null,
    }

    static propTypes = {
      excludedChartVariables: PropTypes.object,
      protocolId: PropTypes.string,
      totalSessionsCount: PropTypes.number,
      transposedRegistry: Types.variableRegistry.isRequired,
    }

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
      const prevCount = prevProps.totalSessionsCount;
      const newCount = this.props.totalSessionsCount;
      // When mounted (on each workspace load), totalSessionsCount is null.
      // Only reload data when session count changes (i.e., a session was
      // imported or deleted while on this workspace).
      if (newCount !== null && prevCount !== null && newCount !== prevCount) {
        this.loadData();
      }

      if (!prevProps.protocolId && this.props.protocolId) {
        this.loadData();
      }
    }

    loadData() {
      const {
        excludedChartVariables,
        protocolId,
        transposedRegistry: { node: nodeRegistry = {} },
      } = this.props;

      if (!protocolId) {
        return;
      }

      const variableNames = Object.values(nodeRegistry).reduce((acc, nodeTypeDefinition) => {
        acc.push(...Object.keys(nodeTypeDefinition.variables || {}));
        return acc;
      }, []);

      const route = `/protocols/${this.props.protocolId}/reports/option_buckets`;
      const query = { variableNames };

      this.apiClient.get(route, query)
        .then(({ buckets }) => {
          this.setState({
            charts: shapeBucketData(nodeRegistry, buckets, excludedChartVariables),
          });
        });
    }

    render() {
      return <WrappedComponent {...this.props} answerDistributionCharts={this.state.charts} />;
    }
  };

  const mapStateToProps = (state, ownProps) => ({
    excludedChartVariables: excludedVariablesForCurrentProtocol(state, ownProps),
    protocolId: currentProtocolId(state, ownProps),
    transposedRegistry: transposedRegistry(state, ownProps),
  });

  return connect(mapStateToProps)(AnswerDistributionPanels);
};

export default withAnswerDistributionCharts;
