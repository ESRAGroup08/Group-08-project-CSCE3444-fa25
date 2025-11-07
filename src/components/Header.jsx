import React from 'react';
import './Header.css';

const Header = () => {
  return (
    <header className="site-header">
      <nav className="utility-nav" aria-label="Utility Menu">
        <button className="utility-button" aria-label="Add Friend">
          Add Friend
        </button>
        <button className="utility-button" aria-label="Settings">
          Settings
        </button>
      </nav>
    </header>
  );
};

export default Header;