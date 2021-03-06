const miss = require('mississippi');

const csvEOL = '\r\n'; // always this, not os-specific

/**
 * @param  {string} value a string potentially containing quotes
 * @return {string} a quote-delimited string, with internal quotation marks escaped (as '""')
 */
const quoteValue = (value) => `"${value.replace(/"/g, '""')}"`;

/**
 * Returned strings are already quote-escaped as needed.
 * You must not call quoteValue() on the return value of this method.
 * @param value any value to write to a CSV cell. If an object is passed,
 *              this will attempt to JSON.stringify, and fall back to
 * @return {string}
 */
const cellValue = (value) => {
  if (value && typeof value === 'object') {
    let serialized;
    try {
      serialized = JSON.stringify(value);
    } catch (err) {
      serialized = value.toString(); // value will never be null here
    }
    return quoteValue(serialized);
  } if (typeof value === 'string') {
    let escapedValue = value;
    if (value.indexOf('"') >= 0) {
      escapedValue = quoteValue(value);
    } else if (escapedValue.indexOf(',') >= 0) {
      escapedValue = `"${escapedValue}"`; // values containing commas need quotes
    }
    return escapedValue;
  }
  return value;
};

const csvRow = (cells) => `${cells.map((v) => cellValue(v)).join(',')}${csvEOL}`;

const tableToCsv = () => miss.through(
  (row, enc, push) => {
    try {
      push(null, csvRow(JSON.parse(row.toString())));
    } catch (err) {
      err.friendlyMessage = 'Error in tableToCsv()';
      push(err);
    }
  },
  (push) => {
    push(null);
  },
);

module.exports = tableToCsv;
