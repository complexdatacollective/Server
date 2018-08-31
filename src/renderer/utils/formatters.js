const dateOpts = { year: '2-digit', month: 'numeric', day: 'numeric' };

const formatDate = d => d && d.toLocaleString(undefined, dateOpts);

export {
  formatDate, // eslint-disable-line import/prefer-default-export
};
