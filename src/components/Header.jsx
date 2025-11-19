import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();

  const handleAddFriend = () => {
    navigate('/friends');
  };

  const handleSettings = () => {
    navigate('/settings');
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
