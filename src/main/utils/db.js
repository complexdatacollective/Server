const resolveOrReject = (resolve, reject) => (err, data) => {
  if (err) {
    reject(err);
  } else {
    resolve(data);
  }
};

const mostRecent = { createdAt: -1 };

module.exports = {
  mostRecent,
  resolveOrReject,
};
