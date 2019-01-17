import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';

import Types from '../types';
import CheckboxGroup from '../ui/components/Fields/CheckboxGroup';
import { actionCreators, selectors as protocolSelectors } from '../ducks/modules/protocols';
import { actionCreators as chartActionCreators, selectors as chartSelectors } from '../ducks/modules/excludedChartVariables';
import { Button, Spinner } from '../ui';

class SettingsScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      excludedChartVariables: {},
    };
  }

  get chartConfigSection() {
    const { distributionVariables, protocol, setExcludedVariables } = this.props;
    if (!Object.keys(distributionVariables).length) {
      return null;
    }
    return (
      <div className="settings__section">
        <div className="settings__description">
          <h3>Chart Variable Distributions</h3>
          <p>
            Display an Overview chart for distributions of the following ordinal &
            categorical variables
          </p>
          {
            distributionVariables &&
            Object.entries(distributionVariables).map(([section, vars]) => (
              <CheckboxGroup
                key={section}
                className="settings__checkbox-group"
                label={`Type: ${section}`}
                input={{
                  value: this.includedChartVariablesForSection(section),
                  onChange: (newValue) => {
                    const newExcluded = vars.filter(v => !newValue.includes(v));
                    setExcludedVariables(protocol.id, section, newExcluded);
                  },
                }}
                options={vars.map(v => ({ value: v, label: v }))}
              />
            ))
          }
        </div>
      </div>
    );
  }

  deleteProtocol = () => {
    const { deleteProtocol, match } = this.props;
    // eslint-disable-next-line no-alert
    if (match.params.id && confirm('Destroy this protocol and all related data?')) {
      deleteProtocol(match.params.id);
    }
  }

  includedChartVariablesForSection = (section) => {
    const { excludedChartVariables, distributionVariables } = this.props;
    const excludeSection = excludedChartVariables[section];
    return distributionVariables[section].filter(
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
        <h1>{protocol.name}</h1>
        <div className="settings__section">
          <div className="settings__description">
            <h3>Delete this protocol</h3>
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
  distributionVariables: protocolSelectors.ordinalAndCategoricalVariables(state, ownProps),
});

const mapDispatchToProps = dispatch => ({
  deleteProtocol: bindActionCreators(actionCreators.deleteProtocol, dispatch),
  setExcludedVariables: bindActionCreators(chartActionCreators.setExcludedVariables, dispatch),
});

SettingsScreen.defaultProps = {
  apiClient: null,
  distributionVariables: {},
  excludedChartVariables: {},
  protocol: null,
};

SettingsScreen.propTypes = {
  deleteProtocol: PropTypes.func.isRequired,
  distributionVariables: PropTypes.object,
  match: PropTypes.object.isRequired,
  excludedChartVariables: PropTypes.object,
  protocol: Types.protocol,
  protocolsHaveLoaded: PropTypes.bool.isRequired,
  setExcludedVariables: PropTypes.func.isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(SettingsScreen);

export {
  SettingsScreen as UnconnectedSettingsScreen,
};
