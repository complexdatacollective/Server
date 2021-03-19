const dateOpts = { year: '2-digit', month: 'numeric', day: 'numeric' };
const timeOpts = { hour: '2-digit', minute: '2-digit' };
const datetimeOpts = { ...dateOpts, ...timeOpts };

const decimalFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });

const formatDate = (d) => (d ? d.toLocaleString(undefined, dateOpts) : '');
const formatDatetime = (d) => (d ? d.toLocaleString(undefined, datetimeOpts) : '');
const formatDecimal = (n) => (isNaN(n) ? '' : decimalFormatter.format(n));
const formatNumber = (n) => (Number.isInteger(n) ? n.toString() : formatDecimal(n));

export {
  formatDate,
  formatDatetime,
  formatDecimal,
  formatNumber,
};
