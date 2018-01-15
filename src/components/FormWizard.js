import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Icon } from 'network-canvas-ui';

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

const submitButton = onClick => (
  <Button
    key="submit"
    size="small"
    content="Submit"
    onClick={onClick}
  />
);

class FormWizard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pageIndex: 0,
    };
  }

  onSubmit = () => {
    this.props.onSubmit();
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
    return this.props.children[this.state.pageIndex];
  }

  render() {
    return (
      <div className="form-wizard">
        {this.currentPage()}
        <div className="form-wizard__controls">
          <div className="form-wizard__previous">
            {this.state.pageIndex !== 0 && this.props.prevButton(this.previousPage)}
          </div>
          <div className="form-wizard__progress">
            Step {this.state.pageIndex + 1} of {this.props.children.length}
          </div>
          <div className="form-wizard__next">
            {this.shouldShowNextButton() ?
              this.props.nextButton(this.nextPage) :
              this.props.submitButton(this.onSubmit)
            }
          </div>
        </div>
      </div>
    );
  }
}

FormWizard.propTypes = {
  children: PropTypes.node.isRequired,
  prevButton: PropTypes.func,
  nextButton: PropTypes.func,
  submitButton: PropTypes.func,
  onSubmit: PropTypes.func,
};

FormWizard.defaultProps = {
  prevButton,
  nextButton,
  submitButton,
  onSubmit: () => {},
};

export default FormWizard;
