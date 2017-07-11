import React, { Component } from 'react';
import { ipcRenderer } from 'electron';
import TrayMenu from '../components/TrayMenu';
import TrayMenuItem from '../components/TrayMenuItem';

class Tray extends Component {
  openMainWindow = () => {
    ipcRenderer.send('OPEN_MAIN_WINDOW');
  }

  quit = () => {
    ipcRenderer.send('QUIT');
  }

  render() {
    return (
      <div className="tray">
        <TrayMenu>
          <TrayMenuItem action={this.openMainWindow}>
            Export data
          </TrayMenuItem>
          <TrayMenuItem action={this.quit}>
            Quit
          </TrayMenuItem>
        </TrayMenu>
      </div>
    );
  }
}

export default Tray;
