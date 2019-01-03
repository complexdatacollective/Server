const resolveOrReject = (resolve, reject) => (err, data) => {
  if (err) {
    reject(err);
  } else {
    resolve(data);
  }
};

const leastRecent = { createdAt: 1 };
const mostRecent = { createdAt: -1 };

module.exports = {
  leastRecent,
  mostRecent,
  resolveOrReject,
};
