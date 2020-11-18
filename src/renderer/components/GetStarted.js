import React from 'react';
import Instructions from '../components/Instructions';
import serverLogo from '../images/Srv-Flat.svg';
import nc from '../images/NC-Mark.svg';
import getStarted from '../images/charts.svg';

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
            Thank you for installing Server, and supporting the Network Canvas project!
          </p>
          <p>
            Server is designed to support the backend data workflows required by networks
            research. It provides a secure and convinient endpoint for data produced by Interviewer,
            and lets you see realtime summary data about what you are collecting, while retaining
            control over your data. It also provides a platform for exporting data for further
            anaylsis using the tools you are used to working with.
          </p>
          <p>
            Below you will find instructions for the first steps you should take with Server.
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
