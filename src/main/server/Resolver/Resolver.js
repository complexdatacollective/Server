const logger = require('electron-log');
const { resolverMessageTypes, ipcEventTypes, getIpcEventId } = require('./config');
const getResolverStream = require('./getResolverStream');

const readData = (data) => {
  const [type, payload] = data.toString().split(' ');
  return [type, JSON.parse(payload)];
};

class Resolver {
  constructor(sender, requestId, protocolId, options) {
    this.protocolId = protocolId;
    this.requestId = requestId;
    this.sender = sender;
    this.options = options;

    getResolverStream()
      .then((resolverStream) => {
        // emit for each line
        resolverStream.on('data', (data) => {
          // parse events
          const [type, payload] = readData(data);

          switch (type) {
            // MATCH/REJECT handled in stream??
            case resolverMessageTypes.MAYBE:
              this.send(ipcEventTypes.QUERY, payload);
              return;
            case resolverMessageTypes.LOG:
            default:
              logger.debug(type, payload);
          }
        });

        resolverStream.on('error', this.handleError);
        resolverStream.on('end', this.handleEnd);
        resolverStream.on('close', this.handleEnd);
      })
      .catch(this.handleError);
  }

  handleError = (error) => {
    logger.error(ipcEventTypes.ERROR, this.requestId, error);
    this.send(ipcEventTypes.ERROR, { error });
  };

  handleEnd = () => {
    logger.debug(ipcEventTypes.END, this.requestId);
    this.send(ipcEventTypes.END);
  };

  // Send to UI
  send = (eventType, ...args) => {
    const eventId = getIpcEventId(eventType, this.requestId);
    this.sender.send(eventId, ...args);
  }
}

module.exports = Resolver;
