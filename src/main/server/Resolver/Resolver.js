const logger = require('electron-log');
const path = require('path');
const { get } = require('lodash');
const SessionDB = require('../../data-managers/SessionDB');
const ProtocolDB = require('../../data-managers/ProtocolDB');
const castEgoAsNode = require('../../utils/resolver/castEgoAsNode'); // move to formatters?
const { unionOfNetworks } = require('../../utils/formatters/network');
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

    this.resolve();
  }

  getSessions() {
    return this.sessionDb.findAll(this.protocolId, null, null)
      .then(sessions =>
        sessions.map((session) => {
          const caseID = get(session, 'data.sessionVariables.caseID');
          return { ...session.data, _caseID: caseID };
        }),
      );
  }

  getNodes() {
    return Promise.all([
      this.protocolDb.get(this.protocolId),
      this.getSessions(),
    ])
      .then(([
        protocol,
        sessions,
      ]) => {
        const egoCaster = castEgoAsNode(protocol.codebook, this.options.nodeType);
        const { nodes } = unionOfNetworks(sessions.map(egoCaster));
        return nodes;
      })
      .then(nodes =>
        nodes.map(node => ({ nodes: [node._uid], attributes: node.attributes })),
      );
  }

  getResolver() {
    return getResolverStream(this.options.command)
      .then((resolverStream) => {
        // emit for each line
        resolverStream.on('error', this.handleError);
        resolverStream.on('end', this.handleEnd);
        resolverStream.on('close', this.handleEnd);

        return resolverStream;
      })
      .catch(this.handleError);
  }

  resolve() {
    Promise.all([
      this.getResolver(),
      this.getNodes(),
    ])
      .then(([resolverStream, nodes]) => {
        this.result = [...nodes];

        resolverStream
          .on('data', (data) => {
            // parse events
            const [type, payload] = readData(data);

            switch (type) {
              case resolverMessageTypes.MAYBE:
                this.send(ipcEventTypes.QUERY, payload);
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
          });

          while (???) {
            resolverStream.write();
          }
      });
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
