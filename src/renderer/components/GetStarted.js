import React from 'react';
import { Button } from '@codaco/ui';
import Instructions from '../components/Instructions';
import serverLogo from '../images/Srv-Flat.svg';
import nc from '../images/NC-Mark.svg';
import getStarted from '../images/charts.svg';
import { openExternalLink } from './ExternalLink';

const GetStarted = () => (
  <div className="content get-started">
    <section className="get-started__section">
      <div className="get-started__header">
        <div className="header-brand">
          <img src={serverLogo} alt="Network Canvas Server" />
        </div>
        <div className="header-mark">
          <div className="project-tag">
            <img src={nc} alt="Part of the Network Canvas Project" />
            <h5>Network Canvas</h5>
          </div>
          <h1 className="get-started__title">Server</h1>
          <h4>A tool for storing, analyzing, and exporting Network Canvas interview data.</h4>
        </div>
      </div>
      <div className="get-started__content">
        <div className="content-text">
          <h2>Getting Started</h2>
          <p>
            Server is designed to handle the backend data workflows that networks
            research requires. It provides a secure and convenient home for your data in the
            form of protocol-based workspaces, and allows for data to be imported either by pairing
            with your field devices running Interviewer, or using an entirely offline workflow.
            Server also allows you to see realtime summary data, before exporting for further
            analysis in formats compatible with your existing workflow.
          </p>
          <p>
            Below you will find instructions for the first steps you should take with Server,
            including pairing a device, and creating a workspace. For further information, please
            visit our documentation website.
          </p>
          <p>
            <Button onClick={() => openExternalLink('https://documentation.networkcanvas.com')}>Visit Documentation Website</Button>
          </p>
        </div>
        <div className="content-image">
          <img src={getStarted} alt="Data, man..." />
        </div>
      </div>
    </section>
    <Instructions />
  </div>
);

export default GetStarted;
