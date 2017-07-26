import React, { Component } from 'react';
import { ipcRenderer } from 'electron';
import MenuItem from '../components/MenuItem';

class Tray extends Component {
  openWindow = (route) => {
    ipcRenderer.send('WINDOW_OPEN', route);
  }

  quit = () => {
    ipcRenderer.send('APP_QUIT');
  }

  render() {
    return (
      <div className="tray">
        <div className="tray__menu">
          <MenuItem className="tray__menu-item" action={() => { this.openWindow('/'); }}>
            Overview
          </MenuItem>
          <MenuItem className="tray__menu-item" action={() => { this.openWindow('/export'); }}>
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
