import React from 'react';
import './MainMenu.css';
import { useNavigate, Link } from 'react-router-dom';
import Header from './Header.jsx';

const MainMenu = () => {
  const navigate = useNavigate();

  const handleMultiplayer = () => {
    navigate('/lobby');
  };

  const handleLeaderboards = () => {
    navigate('/leaderboard');
  };

  const handleQuit = () => {
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
              <Link to="/profile" className="menu-button">
                PROFILE
              </Link>
            </li>
            <li>
              <button className="menu-button secondary" onClick={handleQuit}>
                QUIT
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
};

export default MainMenu;
