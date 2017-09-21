import React, { Component } from 'react';
import changeCase from 'change-case';
import { ipcRenderer } from '../utils/electron-shim';

export default (property) => {
  const PROPERTY = changeCase.constantCase(property);

  return (WrappedComponent) => {
    const requestUpdate = () => {
      ipcRenderer.send(`REQUEST_${PROPERTY}`);
    };

    return class IPCComponent extends Component {
      constructor() {
        super();

        this.state = {
          [property]: null,
        };

        this.listen();
        requestUpdate();
      }

      listen() {
        ipcRenderer.on(`${PROPERTY}`, (_, data) => {
          this.setState({
            [property]: data,
          });
        });
      }

      render() {
        return <WrappedComponent {...this.state} {...this.props} />;
      }
    };
  };
};
