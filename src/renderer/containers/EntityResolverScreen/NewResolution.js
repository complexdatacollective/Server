/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { isEmpty } from 'lodash';
import { AnimateSharedLayout, AnimatePresence, motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import Text from '@codaco/ui/lib/components/Fields/Text';
import Tip from '../../components/Tip';
import BrowseInput from '../../components/BrowseInput';
import withValidation from './withValidation';
import { getNodeTypes } from './selectors';
import { ExternalLink } from '../../components/ExternalLink';

const ValidatedBrowseInput = withValidation(BrowseInput);

const isRequired = (value) => {
  if (!isEmpty(value)) { return undefined; }
  return 'Required';
};

const getSelectValue = (e) => (isEmpty(e.target.value) ? undefined : e.target.value);

const NewResolution = ({
  onUpdate,
  protocolId,
  initialOptions,
  egoCastType,
}) => {
  const [options, setOptions] = useState(initialOptions);
  const nodeTypes = useSelector((state) => getNodeTypes(state, protocolId));

  const handleUpdateOption = (key) => (value) => setOptions((s) => ({ ...s, [key]: value }));

  useEffect(() => {
    if (egoCastType === null) { return; } // Use last selected when all resolutions are deleted
    handleUpdateOption('egoCastType')(egoCastType);
  }, [egoCastType]);

  useEffect(() => {
    onUpdate(options);
  }, [JSON.stringify(options)]);

  const showResolverPreview = options.interpreterPath || options.resolverPath;

  return (
    <AnimateSharedLayout>
      <motion.div layout className="new-resolution">
        <motion.div layout>
          <table className="new-resolution__options">
            <tbody>
              <tr>
                <td>
                  <h4>Ego Node Cast Type</h4>
                  <p>
                    In order for egos to be compared with nodes, they must be &quot;cast&quot; as a
                    node type. For each field name in the target node type, the resolver will
                    attempt to find a field with the same name on ego, and the resulting node will
                    be used for resolution.
                  </p>
                  { (egoCastType)
                    && (
                    <Tip type="warning">
                      Ego node cast type cannot be changed whilst there are
                      existing resolutions because the results are cumulative.
                    </Tip>
                    )}
                  <select
                    className="select-field"
                    onChange={(e) => handleUpdateOption('egoCastType')(getSelectValue(e))}
                    value={options.egoCastType || ''}
                    disabled={!!egoCastType}
                    required
                  >
                    <option value="">&mdash; Select a node type to convert the ego to&mdash;</option>
                    {nodeTypes.map(({ label, value }) => (
                      <option value={value} key={value}>{label}</option>
                    ))}
                  </select>
                </td>
              </tr>
              <tr>
                <td>
                  <h4>Interpreter</h4>
                  <p>
                    This should point to the binary of your script interpreter,
                    if your
                    {' '}
                    <code>$PATH</code>
                    {' '}
                    environment variable is set up
                    correctly,
                    {' '}
                    <code>python3</code>
                    {' '}
                    should suffice, otherwise
                    you may need to enter the full path of the binary,
                    e.g.
                    {' '}
                    <code>/usr/bin/python3</code>
                    .
                  </p>
                  <ValidatedBrowseInput
                    input={{
                      value: options.interpreterPath,
                      onChange: (value) => handleUpdateOption('interpreterPath')(value),
                    }}
                    validate={isRequired}
                  />
                </td>
              </tr>
              <tr>
                <td>
                  <h4>Resolver Script Path</h4>
                  <p>
                    This should be the path of your custom resolver script. Please
                    read the documentation for more information on
                    {' '}
                    <ExternalLink href="https://github.com/complexdatacollective/entity-resolution-sample">
                      how to create a resolver script
                    </ExternalLink>
                    .
                  </p>
                  <ValidatedBrowseInput
                    input={{
                      value: options.resolverPath,
                      onChange: (value) => handleUpdateOption('resolverPath')(value),
                    }}
                    validate={isRequired}
                  />
                </td>
              </tr>
              <tr>
                <td>
                  <h4>Resolver Script Arguments</h4>
                  <p>
                    If your script requires any configuration options then those
                    should go here.
                  </p>
                  <Text
                    input={{
                      value: options.args,
                      onChange: (e) => handleUpdateOption('args')(e.target.value),
                    }}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </motion.div>
        <AnimatePresence>
          { showResolverPreview
            && (
            <motion.div
              layout
              className="new-resolution__preview"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h4>Resolver command preview</h4>
              <div className="new-resolution__preview-container">
                <code>
                  {options.interpreterPath}
                  {' '}
                  {options.resolverPath}
                  {' '}
                  {options.args}
                </code>
              </div>
            </motion.div>
            )}
        </AnimatePresence>
      </motion.div>
    </AnimateSharedLayout>
  );
};

NewResolution.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  protocolId: PropTypes.string,
  initialOptions: PropTypes.object,
  egoCastType: PropTypes.string,
};

NewResolution.defaultProps = {
  protocolId: null,
  initialOptions: {
    interpreterPath: 'python3',
    resolverPath: '',
    args: '--minimumThreshold 0.9',
    egoCastType: null,
  },
  egoCastType: null,
};

export default NewResolution;
