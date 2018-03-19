import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import { Icon } from 'network-canvas-ui/lib/components';

const Header = ({ title }) => (
  <header className="header">
    <h1 className="header__title">{title || 'Network Canvas Server'}</h1>

    <nav className="header__nav">
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
  title: PropTypes.string,
};

export default Header;
