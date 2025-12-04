import React from 'react';
import './MainMenu.css';
import { useNavigate, Link, useOutletContext } from 'react-router-dom';
import Header from './Header.jsx';

const MainMenu = () => {
  const navigate = useNavigate();
  const { user, setUser, socket } = useOutletContext();

  const SERVER_URL = process.env.NODE_ENV === 'production'
    ? 'https://group-08-project-csce3444-fa25.onrender.com'
    : 'http://localhost:3000';

  const handleMultiplayer = () => {
    navigate('/lobby');
  };

  const handleLeaderboards = () => {
    navigate('/leaderboard');
  };

  const handleLogout = async () => {
    await fetch(`${SERVER_URL}/auth/logout`);
    setUser(null);
    socket.disconnect();
    navigate('/');
  };

  return (
    <>
      <Header />
      <div className="main-menu-container">
        {user && <p className="text-white text-center mb-4">Welcome, {user.username}!</p>}
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
              <Link to={`/profile/${user?.username}`} className="menu-button">
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
              <button className="menu-button secondary" onClick={handleLogout}>
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

