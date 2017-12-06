const cote = require('cote');

const discoveryResponder = new cote.Responder({
  name: 'discoveryRep',
  respondsTo: ['discoveryRequest', 'promised request'], // types of requests this responder
  // can respond to.
});

// request handlers are like any event handler.
discoveryResponder.on('discoveryRequest', (req, cb) => {
  const answer = Math.random() * 10;
  console.log('request', req.val, 'answering with', answer);
  cb(answer);
});
