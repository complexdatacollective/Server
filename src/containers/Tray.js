import React, { Component } from 'react';
import { ipcRenderer } from 'electron';

class Tray extends Component {
  openMainWindow = () => {
    ipcRenderer.send('OPEN_MAIN_WINDOW');
  }

  render() {
    return (
      <div>
        <strong>Network Canvas Server</strong><br />
        <button onClick={this.openMainWindow}>Open export tool</button>
      </div>
    );
  }
}

export default Tray;
