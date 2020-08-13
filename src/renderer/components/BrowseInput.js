import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import uuid from 'uuid';
import { get } from 'lodash';
import Text from '@codaco/ui/lib/components/Fields/Text';

const BrowseInput = (props) => {
  const id = useRef(uuid());

  const handleSelectFile = (e) => {
    const filePath = get(e.target, ['files', 0, 'path']);
    if (!filePath) { return; }
    props.input.onChange(filePath);
  };

  const inputProps = {
    ...props,
    input: {
      ...props.input,
      onChange: e => props.input.onChange(e.target.value),
    },
  };

  return (
    <div clasName="form-field-browse">
      <div clasName="form-field-browse__button-container">
        <input
          clasName="form-field-browse__input"
          type="file"
          id={id.current}
          onChange={handleSelectFile}
          disabled={props.input.disabled}
        />
        <label htmlFor={id.current} clasName="form-field-browse__button">Browse</label>
      </div>
      <Text {...inputProps} />
    </div>
  );
};

BrowseInput.propTypes = {
  input: PropTypes.shape({
    onChange: PropTypes.func.isRequired,
    value: PropTypes.string.isRequired,
    disabled: PropTypes.bool,
  }).isRequired,
};

export default BrowseInput;
