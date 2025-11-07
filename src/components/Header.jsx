import React from 'react';
import './Header.css';

const Header = () => {
<<<<<<< HEAD
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
=======
  return (
    <header className="site-header">
      <nav className="utility-nav" aria-label="Utility Menu">
        <button className="utility-button" aria-label="Add Friend">
          Add Friend
        </button>
        <button className="utility-button" aria-label="Settings">
>>>>>>> b762ce29dd0a5f97fce93f702171f220016225ed
          Settings
        </button>
      </nav>
    </header>
  );
};

<<<<<<< HEAD
export default Header;
=======
export default Header;
>>>>>>> b762ce29dd0a5f97fce93f702171f220016225ed
