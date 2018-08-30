const resolveWithDocCount = resolve => (collection) => {
  resolve(collection.reduce((sum, doc) => {
    sum += doc.data.nodes.length; // eslint-disable-line no-param-reassign
    return sum;
  }, 0));
};

const resolveOrReject = (resolve, reject) => (err, data) => {
  if (err) {
    reject(err);
  } else {
    resolve(data);
  }
};

const mostRecent = { createdAt: -1 };

module.exports = {
  resolveWithDocCount,
  mostRecent,
  resolveOrReject,
};
