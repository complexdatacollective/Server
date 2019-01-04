const dateOpts = { year: '2-digit', month: 'numeric', day: 'numeric' };

const decimalFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });

const formatDate = d => (d ? d.toLocaleString(undefined, dateOpts) : '');
const formatDecimal = n => (isNaN(n) ? '' : decimalFormatter.format(n));
const formatNumber = n => (Number.isInteger(n) ? n.toString() : formatDecimal(n));

export {
  formatDate,
  formatDecimal,
  formatNumber,
};
