import React from 'react';
import AppRoutes from './AppRoutes';
import { Header, TabBar } from '../components';

require('../styles/main.scss');

/**
 * @class App
  * Main app container.
  * @param props {object} - children
  */
const App = () => (
  <div className="app">
    <Header className="app__header" />
    <div className="app__content">
      <nav className="app__sidebar" />
      <div className="app__screen">
        <TabBar />
        <main className="app__main">
          <AppRoutes />
        </main>
      </div>
    </div>
  </div>
);

export default App;
