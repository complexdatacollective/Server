import React from 'react';
import PropTypes from 'prop-types';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(err) {
    console.error(err);
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ border: '1px solid red', background: 'pink', padding: '2rem' }}>
          Something went wrong.
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ErrorBoundary;
