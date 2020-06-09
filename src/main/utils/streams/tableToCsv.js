const miss = require('mississippi');
const { cellValue, csvEOL } = require('../formatters/csv');

const csvRow = cells =>
  `${cells.map(v => cellValue(v)).join(',')}${csvEOL}`;

const tableToCsv = () => miss.through(
  (row, enc, push) => {
    push(null, csvRow(JSON.parse(row.toString())));
  },
  (push) => {
    push(null);
  },
);

module.exports = tableToCsv;
