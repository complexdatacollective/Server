import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Icon } from 'network-canvas-ui';

const prevButton = onClick => (
  <button key="prev" className="form__prev-button" aria-label="Submit" onClick={onClick}>
    <Icon name="form-arrow-left" />
  </button>
);

const nextButton = onClick => (
  <button key="next" className="form__next-button" aria-label="Submit" onClick={onClick}>
    <Icon name="form-arrow-right" />
  </button>
);

class FormWizard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pageIndex: 0,
    };
  }

  nextPage = () => {
    const count = this.props.children.length;
    this.setState({
      pageIndex: (this.state.pageIndex + 1 + count) % count,
    });
  };

  previousPage = () => {
    const count = this.props.children.length;
    this.setState({
      pageIndex: (this.state.pageIndex - 1 + count) % count,
    });
  };

  shouldShowNextButton = () => {
    const showingLastField = this.state.pageIndex === this.props.children.length - 1;
    return !showingLastField;
  }

  currentPage() {
    return [this.props.children[this.state.pageIndex]];
  }

  render() {
    return (
      <div className="form-wizard">
        <div className="form-wizard__previous">
          {this.state.pageIndex !== 0 && this.props.prevButton(this.previousPage)}
        </div>
        {this.currentPage()}
        {this.shouldShowNextButton() && [this.props.nextButton(this.nextPage)]}
      </div>
    );
  }
}

FormWizard.propTypes = {
  children: PropTypes.node.isRequired,
  prevButton: PropTypes.func,
  nextButton: PropTypes.func,
};

FormWizard.defaultProps = {
  prevButton,
  nextButton,
};

export default FormWizard;
