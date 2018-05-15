import PropTypes from 'prop-types';

const device = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  createdAt: PropTypes.instanceOf(Date).isRequired,
});

const devices = PropTypes.arrayOf(device);

// For now, these have the same shape
const protocol = device;

const protocols = PropTypes.arrayOf(protocol);

const Types = {
  device,
  devices,
  protocol,
  protocols,
};

export default Object.freeze(Types);
