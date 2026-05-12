import React from 'react';
import './MainMenu.css';
import { useNavigate, Link } from 'react-router-dom';

const MainMenu = () => {
  const navigate = useNavigate();
  // Get the username from localStorage to build the correct link
  const username = localStorage.getItem('username');

  const handleMultiplayer = () => {
    navigate('/lobby');
  };

  const handleLeaderboards = () => {
    navigate('/leaderboard');
  };

  const handleQuit = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    navigate('/');
  };

  return (
    <>
      <div className="main-menu-container">
        <nav className="main-navigation" aria-label="Main game menu">
          <div className="menu-grid">
            <button className="menu-button primary-action" onClick={handleMultiplayer}>
              MULTIPLAYER
            </button>
            <Link to="/daily-challenges" className="menu-button">
              DAILY CHALLENGES
            </Link>
            
            <button className="menu-button" onClick={handleLeaderboards}>
              LEADERBOARDS
            </button>
            {/* MODIFIED: The link now includes the username */}
            <Link to={`/profile/${username}`} className="menu-button">
              PROFILE
            </Link>
            
            <Link to="/friends" className="menu-button">
              FRIENDS
            </Link>
            <Link to="/settings" className="menu-button">
              SETTINGS
            </Link>
            
            <button className="menu-button secondary" onClick={handleQuit}>
              LOGOUT
            </button>
          </div>
        </nav>
      </div>
    </>
  );
};

export default MainMenu;
