import PropTypes from 'prop-types';

const protocol = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  createdAt: PropTypes.instanceOf(Date).isRequired,
});

const protocols = PropTypes.arrayOf(protocol);

const Types = {
  protocol,
  protocols,
};

export default Object.freeze(Types);
