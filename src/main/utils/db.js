const resolveOrReject = (resolve, reject) => (err, data) => {
  if (err) {
    reject(err);
  } else {
    resolve(data);
  }
};

const leastRecentlyCreated = { createdAt: 1 };
const mostRecentlyCreated = { createdAt: -1 };
const leastRecentlyUpdated = { updatedAt: 1 };
const mostRecentlyUpdated = { updatedAt: -1 };
const caseIdAscending = { 'data.sessionVariables._caseID': 1 };
const caseIdDescending = { 'data.sessionVariables._caseID': -1 };
const sessionIdAscending = { _id: 1 };
const sessionIdDescending = { _id: -1 };

module.exports = {
  leastRecentlyCreated,
  mostRecentlyCreated,
  leastRecentlyUpdated,
  mostRecentlyUpdated,
  caseIdAscending,
  caseIdDescending,
  sessionIdAscending,
  sessionIdDescending,
  resolveOrReject,
};
