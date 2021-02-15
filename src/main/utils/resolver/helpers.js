const formatSession = ({ data, createdAt }) => ({ date: createdAt, ...data });

const formatResolution = ({
  _id,
  createdAt,
  transforms,
  options,
}) => ({
  id: _id,
  date: createdAt,
  transformCount: transforms.length,
  options,
  transforms,
});

module.exports = {
  formatSession,
  formatResolution,
};
