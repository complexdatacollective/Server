import React, { Component } from 'react';
import { ipcRenderer, remote } from 'electron';

const getGlobal = property => (remote ? remote.getGlobal(property) : {});

export default property =>
  WrappedComponent =>
    class IPCComponent extends Component {
      constructor() {
        super();

        this.state = {
          [property]: getGlobal(property),
        };

        if (ipcRenderer && ipcRenderer.on) {
          ipcRenderer.on('GLOBAL_UPDATED', () => {
            this.setState({
              [property]: getGlobal(property),
            });
          });
        }
      }

      render() {
        return <WrappedComponent {...this.state} {...this.props} />;
      }
    };
