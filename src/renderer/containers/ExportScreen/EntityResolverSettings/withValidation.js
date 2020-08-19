import React, { useState, useEffect } from 'react';
import { get } from 'lodash';

const withValidation = WrappedComponent =>
  (props) => {
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

        setMetaState(prevState => ({ ...prevState, touched: true, error, invalid: !!error }));
      }
    }, [value]);

    const componentProps = {
      ...props,
      meta: {
        ...props.meta,
        ...metaState,
      },
    };

    return <WrappedComponent {...componentProps} />;
  };

export default withValidation;
