import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { Button } from '@codaco/ui';
import Text from '@codaco/ui/lib/components/Fields/Text';
import './BrowseInput.scss';

const BrowseInput = (props) => {
  const fileRef = useRef();

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

  const handleClick = () => {
    if (!fileRef.current) { return; }
    fileRef.current.click();
  };

  return (
    <div className="form-field-browse">
      <input
        className="form-field-browse__file"
        type="file"
        ref={fileRef}
        onChange={handleSelectFile}
        disabled={props.input.disabled}
      />
      <div className="form-field-browse__button">
        <Button onClick={handleClick} size="small">Browse</Button>
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
