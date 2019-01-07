import PropTypes from 'prop-types';

const deviceApiInfo = PropTypes.shape({
  publicAddresses: PropTypes.arrayOf(PropTypes.string).isRequired,
  httpPort: PropTypes.number.isRequired,
});

const device = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  createdAt: PropTypes.instanceOf(Date).isRequired,
});

const devices = PropTypes.arrayOf(device);

// For now, these have the same shape
const protocol = device;

const protocols = PropTypes.arrayOf(protocol);

const variableDefinition = PropTypes.shape({
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  })),
});

const entityName = PropTypes.oneOf(['node', 'edge']);

const Types = {
  deviceApiInfo,
  device,
  devices,
  entityName,
  protocol,
  protocols,
  variableDefinition,
};

export default Object.freeze(Types);

export { PropTypes };
