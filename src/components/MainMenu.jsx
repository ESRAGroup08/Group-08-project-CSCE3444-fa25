import React from 'react';
import './MainMenu.css';
import { useNavigate } from 'react-router-dom';
import Header from './Header.jsx';

const MainMenu = () => {
  const navigate = useNavigate();

<<<<<<< HEAD
  const handleMultiplayer = () => {
    navigate('/lobby');
  };

  const handleLeaderboards = () => {
    navigate('/leaderboard');
  };

  const handleQuit = () => {
    navigate('/');
  };

=======
>>>>>>> b762ce29dd0a5f97fce93f702171f220016225ed
  return (
    <>
      <Header />
      <div className="main-menu-container">
        <nav className="main-navigation" aria-label="Main game menu">
          <ul>
            <li>
<<<<<<< HEAD
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
              <button className="menu-button secondary" onClick={handleQuit}>
                QUIT
              </button>
=======
              <button className="menu-button" onClick={() => navigate('/lobby')}>
                Multiplayer
              </button>
            </li>
            <li>
              <button className="menu-button">Leaderboards</button>
            </li>
            <li>
              <button className="menu-button secondary">Quit</button>
>>>>>>> b762ce29dd0a5f97fce93f702171f220016225ed
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
};

<<<<<<< HEAD
export default MainMenu;
=======
export default MainMenu;
>>>>>>> b762ce29dd0a5f97fce93f702171f220016225ed
