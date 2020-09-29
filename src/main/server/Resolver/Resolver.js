const logger = require('electron-log');
const path = require('path');
const { get, flow } = require('lodash');
const SessionDB = require('../../data-managers/SessionDB');
const ProtocolDB = require('../../data-managers/ProtocolDB');
const castEgoAsNode = require('../../utils/resolver/castEgoAsNode'); // move to formatters?
const { unionOfNetworks, formatSessionAsNetwork  } = require('../../utils/formatters/network');
const { resolverMessageTypes, ipcEventTypes, getIpcEventId } = require('./config');
const getResolverStream = require('./getResolverStream');

const readData = (data) => {
  const [type, payload] = data.toString().split(' ');
  return [type, JSON.parse(payload)];
};

class Resolver {
  constructor(
    dataDir,
    sender,
    requestId,
    protocolId,
    options,
  ) {
    console.log('NEW resolver');
    this.protocolId = protocolId;
    this.requestId = requestId;
    this.sender = sender;
    this.options = options;
    this.sessionDb = new SessionDB(path.join(dataDir, 'db', 'sessions.db'));
    this.protocolDb = new ProtocolDB(path.join(dataDir, 'db', 'protocols.db'));
    this.resolverStream = null;

    this.state = {
      index: 0,
      nodes: [],
    };

    this.resolve();
  }

  // Send to UI
  send = (eventType, ...args) => {
    const eventId = getIpcEventId(eventType, this.requestId);
    this.sender.send(eventId, ...args);
  }

  handleError = (error) => {
    logger.error(ipcEventTypes.ERROR, this.requestId, error);
    this.send(ipcEventTypes.ERROR, { error });
  };

  handleEnd = () => {
    logger.debug(ipcEventTypes.END, this.requestId);
    this.send(ipcEventTypes.END);
  };

  getNetwork() {
    // TODO: This should return the latest RESOLVED network using transformSessions
    // Does this make sense to belong to Resolver?
    return this.protocolDb.get(this.protocolId)
      .then((protocol) => {
        const egoCaster = castEgoAsNode(protocol.codebook, this.options.nodeType);
        const processSession = flow([formatSessionAsNetwork, egoCaster]);

        return this.sessionDb.findAll(this.protocolId, null, null)
          .then(sessions => sessions.map(processSession))
          .then(unionOfNetworks);
      });
  }

  initializeState() {
    return this.getNetwork()
      .then(({ nodes }) =>
        // eslint-disable-next-line no-underscore-dangle
        nodes.map(node => ({ nodes: [node._uid], attributes: node.attributes })),
      )
      .then((nodes) => {
        this.state = {
          nodes,
          index: 0,
        };
      });
  }

  initializeResolver() {
    return getResolverStream(this.options.command)
      .then((resolverStream) => {
        this.resolverStream = resolverStream;

        resolverStream.on('error', this.handleError);
        resolverStream.on('end', this.handleEnd);
        resolverStream.on('close', this.handleEnd);
        resolverStream.on('data', (data) => {
          // parse events
          const [type, payload] = readData(data);

          this.update(type, payload);
        });
      })
      .catch(this.handleError);
  }

  next() {
    const nodes = this.state.nodes.slice(this.state.index, this.state.index + 2);
    const data = { nodes };
    const message = `RESOLVE ${JSON.stringify(data)}`;
    this.resolverStream.write(message);
  }

  update(type, payload) {
    switch (type) {
      case resolverMessageTypes.MAYBE:
        this.send(ipcEventTypes.QUERY, payload); // ?? should it also listen? it could
        return;
      case resolverMessageTypes.MATCH:
        // payload = { ids, attributes }
        return;
      case resolverMessageTypes.REJECT:
        // payload = { ids }
        return;
      case resolverMessageTypes.LOG:
      default:
        logger.debug(type, payload);
    }

    this.next();
  }

  resolve() {
    Promise.all([
      this.initializeState(),
      this.initializeResolver(),
    ])
      .then(this.next);
  }
}

module.exports = Resolver;
