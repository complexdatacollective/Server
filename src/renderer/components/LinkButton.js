import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router';
import { Button } from '../ui/components';

const LinkButton = (props) => {
  const {
    history,
    location,
    match,
    staticContext,
    to,
    onClick,
    ...rest
  } = props;
  return (
    <Button
      {...rest}
      onClick={() => {
        history.push(to);
      }}
    />
  );
};

LinkButton.propTypes = {
  history: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  match: PropTypes.object.isRequired,
  staticContext: PropTypes.object,
  onClick: PropTypes.func,
  to: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

LinkButton.defaultProps = {
  staticContext: {},
  onClick: () => {},
};

export default withRouter(LinkButton);
