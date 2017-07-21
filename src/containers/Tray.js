import React, { Component } from 'react';
import { ipcRenderer } from 'electron';
import MenuItem from '../components/MenuItem';

class Tray extends Component {
  openMainWindow = (route) => {
    ipcRenderer.send('OPEN_MAIN_WINDOW', route);
  }

  quit = () => {
    ipcRenderer.send('QUIT');
  }

  render() {
    return (
      <div className="tray">
        <div className="tray__menu">
          <MenuItem className="tray__menu-item" action={() => { this.openMainWindow('/'); }}>
            Overview
          </MenuItem>
          <MenuItem className="tray__menu-item" action={() => { this.openMainWindow('/export'); }}>
            Export data
          </MenuItem>
          <MenuItem className="tray__menu-item" action={this.quit}>
            Quit
          </MenuItem>
        </div>
      </div>
    );
  }
}

export default Tray;
