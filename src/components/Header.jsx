import React from 'react';
import './Header.css';

const Header = () => {
  const handleAddFriend = () => {
    alert("Add Friend feature is not yet implemented.");
  };

  const handleSettings = () => {
    alert("Settings feature is not yet implemented.");
  };

  return (
    <header className="site-header">
      <nav className="utility-nav" aria-label="Utility Menu">
        <button className="utility-button" aria-label="Add Friend" onClick={handleAddFriend}>
          Add Friend
        </button>
        <button className="utility-button" aria-label="Settings" onClick={handleSettings}>
          Settings
        </button>
      </nav>
    </header>
  );
};

export default Header;