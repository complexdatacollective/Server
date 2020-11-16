import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Redirect, withRouter } from 'react-router-dom';
import { compose } from 'recompose';
import { Button, Spinner } from '@codaco/ui';
import CheckboxGroup from '@codaco/ui/lib/components/Fields/CheckboxGroup';
import { entityLabel } from '../components/workspace/AnswerDistributionPanel';
import { actionCreators as dialogActions } from '../ducks/modules/dialogs';
import Types from '../types';
import { actionCreators, selectors as protocolSelectors } from '../ducks/modules/protocols';
import { actionCreators as chartActionCreators, selectors as chartSelectors } from '../ducks/modules/excludedChartVariables';

const entityName = (entityKey) => {
  if (entityKey === 'nodes') return 'node';
  if (entityKey === 'edges') return 'edge';
  if (entityKey === 'ego') return 'ego';
  return null;
};

const entityVariableType = (codebook, entity, section) => (
  codebook && codebook[entityName(entity)] && codebook[entityName(entity)][section] &&
    codebook[entityName(entity)][section].name);

const entityVariableName = (codebook, entity, section, variable) => {
  if (entity === 'ego') {
    return (codebook && codebook[entityName(entity)] && codebook[entityName(entity)].variables &&
      codebook[entityName(entity)].variables[variable] &&
      codebook[entityName(entity)].variables[variable].name) || variable;
  }

  return (codebook && codebook[entityName(entity)] && codebook[entityName(entity)][section] &&
    codebook[entityName(entity)][section].variables[variable] &&
    codebook[entityName(entity)][section].variables[variable].name) || variable;
};

class SettingsScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      excludedChartVariables: {},
    };
  }

  get chartConfigSection() {
    const { distributionVariables, protocol, codebook, setExcludedVariables } = this.props;
    if (!Object.keys(distributionVariables).length) {
      return null;
    }
    return (
      <div className="settings__section">
        <div className="settings__description">
          <h3>Overview screen charts</h3>
          <p>
            Display a chart on the overview screen for distributions of the following ordinal and
            categorical variables.
          </p>
          {
            distributionVariables &&
            Object.entries(distributionVariables).map(([entity, varsWithTypes]) => (
              Object.entries(varsWithTypes).map(([section, vars]) => (
                <CheckboxGroup
                  key={section}
                  className="settings__checkbox-group"
                  label={entityLabel(entity, entityVariableType(codebook, entity, section))}
                  input={{
                    value: this.includedChartVariablesForSection(entity, section),
                    onChange: (newValue) => {
                      const newExcluded = vars.filter(v => !newValue.includes(v));
                      setExcludedVariables(protocol.id, entity, section, newExcluded);
                    },
                  }}
                  options={vars.map(v =>
                    ({ value: v, label: entityVariableName(codebook, entity, section, v) }))}
                />
              ))))
          }
        </div>
      </div>
    );
  }

  deleteProtocol = () => {
    const { deleteProtocol, match, openDialog } = this.props;
    // eslint-disable-next-line no-alert
    if (match.params.id) {
      openDialog({
        type: 'Warning',
        title: 'Remove this protocol from Server?',
        confirmLabel: 'Remove protocol',
        onConfirm: () => deleteProtocol(match.params.id),
        message: 'Remove this protocol (and all associated data) from Server? This will also remove all interview session data. This action cannot be undone!',
      });
    }
  }

  includedChartVariablesForSection = (entity, section) => {
    const { excludedChartVariables, distributionVariables } = this.props;
    const excludeSection = excludedChartVariables[entity] &&
      excludedChartVariables[entity][section];
    return distributionVariables[entity][section].filter(
      variable => !excludeSection || !excludeSection.includes(variable));
  }

  render() {
    const { protocol, protocolsHaveLoaded } = this.props;

    if (protocolsHaveLoaded && !protocol) { // This protocol doesn't exist
      return <Redirect to="/" />;
    }

    if (!protocol) { // This protocol hasn't loaded yet
      return <div className="settings--loading"><Spinner /></div>;
    }

    return (
      <div className="settings">
        <h1>Settings</h1>
        <div className="settings__section">
          <div className="settings__description">
            <h3>Delete this workspace</h3>
            <p>
              This will permanently remove this Server’s copy of the protocol file
              and any associated data that has been imported.
            </p>
          </div>
          <div className="settings__action">
            <Button color="tomato" onClick={this.deleteProtocol}>
              Delete
            </Button>
          </div>
        </div>
        { this.chartConfigSection }
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  excludedChartVariables: chartSelectors.excludedVariablesForCurrentProtocol(state, ownProps),
  protocolsHaveLoaded: protocolSelectors.protocolsHaveLoaded(state),
  protocol: protocolSelectors.currentProtocol(state, ownProps),
  codebook: protocolSelectors.currentCodebook(state, ownProps),
  distributionVariables: protocolSelectors.ordinalAndCategoricalVariables(state, ownProps),
});

const mapDispatchToProps = dispatch => ({
  deleteProtocol: bindActionCreators(actionCreators.deleteProtocol, dispatch),
  setExcludedVariables: bindActionCreators(chartActionCreators.setExcludedVariables, dispatch),
  openDialog: bindActionCreators(dialogActions.openDialog, dispatch),
});

SettingsScreen.defaultProps = {
  apiClient: null,
  distributionVariables: {},
  excludedChartVariables: {},
  codebook: {},
  protocol: null,
};

SettingsScreen.propTypes = {
  deleteProtocol: PropTypes.func.isRequired,
  distributionVariables: PropTypes.object,
  match: PropTypes.object.isRequired,
  excludedChartVariables: PropTypes.object,
  codebook: PropTypes.object,
  protocol: Types.protocol,
  protocolsHaveLoaded: PropTypes.bool.isRequired,
  setExcludedVariables: PropTypes.func.isRequired,
  openDialog: PropTypes.func.isRequired,
};

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  withRouter,
)(SettingsScreen);

export {
  SettingsScreen as UnconnectedSettingsScreen,
};
