import React from 'react';
import './MainMenu.css';
import { useNavigate, Link } from 'react-router-dom';
import Header from './Header.jsx';

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
    localStorage.removeItem('username');
    navigate('/');
  };

  return (
    <>
      <Header />
      <div className="main-menu-container">
        <nav className="main-navigation" aria-label="Main game menu">
          <ul>
            <li>
              <button className="menu-button" onClick={handleMultiplayer}>
                MULTIPLAYER
              </button>
            </li>
            <li>
              <button className="menu-button" onClick={handleLeaderboards}>
                LEADERBOARDS
              </button>
            </li>
            <li>
              {/* MODIFIED: The link now includes the username */}
              <Link to={`/profile/${username}`} className="menu-button">
                PROFILE
              </Link>
            </li>
            <li>
              <Link to="/friends" className="menu-button">
                FRIENDS
              </Link>
            </li>
            <li>
              <Link to="/settings" className="menu-button">
                SETTINGS
              </Link>
            </li>
            <li>
              <Link to="/daily-challenges" className="menu-button">
                DAILY CHALLENGES
              </Link>
            </li>
            <li>
              <button className="menu-button secondary" onClick={handleQuit}>
                LOGOUT
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
};

export default MainMenu;