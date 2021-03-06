import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';

const withValidation = (WrappedComponent) => {
  const ValidatedComponent = (props) => {
    const { meta } = props;
    const value = get(props, 'input.value', null);
    const [metaState, setMetaState] = useState({
      value,
      invalid: null,
      touched: false,
      error: null,
    });

    useEffect(() => {
      if (metaState.value !== value) {
        const error = props.validate(value);

        setMetaState((prevState) => ({
          ...prevState, touched: true, error, invalid: !!error,
        }));
      }
    }, [value]);

    const componentProps = {
      ...props,
      meta: {
        ...meta,
        ...metaState,
      },
    };

    // eslint-disable-next-line react/jsx-props-no-spreading
    return <WrappedComponent {...componentProps} />;
  };

  ValidatedComponent.propTypes = {
    meta: PropTypes.object,
    validate: PropTypes.func.isRequired,
  };

  ValidatedComponent.defaultProps = {
    meta: {},
  };

  return ValidatedComponent;
};

export default withValidation;
