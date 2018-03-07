import React from 'react';
import PropTypes from 'prop-types';
import { withRouter, Link, NavLink } from 'react-router-dom';
import { Icon } from 'network-canvas-ui/lib/components';

const Header = ({ location, title }) => (
  <header className="header">
    <h1 className="header__title">{title || 'Network Canvas Server'}</h1>

    <nav className="header__nav">
      <Link to={`${location.pathname}/modal/pair`} className="header__link">
        Pair
      </Link>
      <NavLink to="/settings" className="header__link">
        <Icon name="settings" />
      </NavLink>
    </nav>
  </header>
);

Header.defaultProps = {
  title: '',
};

Header.propTypes = {
  location: PropTypes.object.isRequired,
  title: PropTypes.string,
};

export default withRouter(Header);
