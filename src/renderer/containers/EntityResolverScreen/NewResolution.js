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

const ValidatedBrowseInput = withValidation(BrowseInput);

const formatSessionCount = (sessionCount) => {
  if (sessionCount === 1) {
    return `${sessionCount} new session`;
  }

  return `${sessionCount} new sessions`;
};

const isRequired = (value) => {
  if (!isEmpty(value)) { return undefined; }
  return 'Required';
};

const getSelectValue = e =>
  (isEmpty(e.target.value) ? undefined : e.target.value);

const NewResolution = ({
  onUpdate,
  protocolId,
  initialOptions,
  unresolved,
  egoCastType,
}) => {
  const [options, setOptions] = useState(initialOptions);
  const nodeTypes = useSelector(state => getNodeTypes(state, protocolId));

  const handleUpdateOption = key => value =>
    setOptions(s => ({ ...s, [key]: value }));

  useEffect(() => {
    if (egoCastType === null) { return; }
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
          <p>
            There are <strong>{`${formatSessionCount(unresolved)}`}</strong> since the last resolution.
          </p>
          <table className="new-resolution__options">
            <tbody>
              <tr>
                <td>
                  <h4>Ego Node Cast Type</h4>
                  <select
                    className="select-field"
                    onChange={e => handleUpdateOption('egoCastType')(getSelectValue(e))}
                    value={options.egoCastType || ''}
                    disabled={!!egoCastType}
                    required
                  >
                    <option value="">&mdash; Select a node type to convert the ego to&mdash;</option>
                    {nodeTypes.map(({ label, value }) => (
                      <option value={value} key={value}>{label}</option>
                    ))}
                  </select>
                  { (egoCastType) &&
                    <Tip type="warning">
                      <p>
                        Ego node cast type cannot be changed whilst there are
                        existing resolutions because the results are cumulative.
                      </p>
                    </Tip>
                  }
                </td>
              </tr>
              <tr>
                <td>
                  <h4>Interpreter</h4>
                  <ValidatedBrowseInput
                    input={{
                      value: options.interpreterPath,
                      onChange: value => handleUpdateOption('interpreterPath')(value),
                    }}
                    validate={isRequired}
                  />
                </td>
              </tr>
              <tr>
                <td>
                  <h4>Resolver Script Path</h4>
                  <ValidatedBrowseInput
                    input={{
                      value: options.resolverPath,
                      onChange: value => handleUpdateOption('resolverPath')(value),
                    }}
                    validate={isRequired}
                  />
                </td>
              </tr>
              <tr>
                <td>
                  <h4>Resolver Script Arguments</h4>
                  <Text
                    input={{
                      value: options.args,
                      onChange: e => handleUpdateOption('args')(e.target.value),
                    }}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </motion.div>
        <AnimatePresence>
          { showResolverPreview &&
            <motion.div
              layout
              className="new-resolution__preview"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h4>Resolver command preview</h4>
              <div className="new-resolution__preview-container">
                <code>{options.interpreterPath} {options.resolverPath} {options.args}</code>
              </div>
            </motion.div>
          }
        </AnimatePresence>
      </motion.div>
    </AnimateSharedLayout>
  );
};

NewResolution.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  protocolId: PropTypes.string,
  initialOptions: PropTypes.object,
  unresolved: PropTypes.number,
  egoCastType: PropTypes.string,
};

NewResolution.defaultProps = {
  protocolId: null,
  initialOptions: {
    interpreterPath: 'python3',
    resolverPath: '',
    args: '--minimumThreshold=0.9995',
    egoCastType: null,
  },
  unresolved: null,
  egoCastType: null,
};

export default NewResolution;
