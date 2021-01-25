const miss = require('mississippi');
const { cellValue, csvEOL } = require('../formatters/csv');

const csvRow = cells =>
  `${cells.map(v => cellValue(v)).join(',')}${csvEOL}`;

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
