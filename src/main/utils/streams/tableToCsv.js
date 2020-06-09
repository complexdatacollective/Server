const miss = require('mississippi');
const { cellValue, csvEOL } = require('../formatters/csv');

const csvRow = cells =>
  `${cells.map(v => cellValue(v)).join(',')}${csvEOL}`;

const tableToCsv = () => miss.through({ objectMode: true }, (row, enc, push) => {
  push(null, csvRow(row));
});

module.exports = tableToCsv;
