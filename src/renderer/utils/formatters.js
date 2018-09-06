const dateOpts = { year: '2-digit', month: 'numeric', day: 'numeric' };

const decimalFormatter = new Intl.NumberFormat();

const formatDate = d => (d ? d.toLocaleString(undefined, dateOpts) : '');
const formatDecimal = n => (isNaN(n) ? '' : decimalFormatter.format(n));

export {
  formatDate,
  formatDecimal,
};
