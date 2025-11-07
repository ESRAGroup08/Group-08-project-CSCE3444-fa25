import React from 'react';
import './MainMenu.css';
import { useNavigate } from 'react-router-dom';
import Header from './Header.jsx';

const MainMenu = () => {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <div className="main-menu-container">
        <nav className="main-navigation" aria-label="Main game menu">
          <ul>
            <li>
              <button className="menu-button" onClick={() => navigate('/lobby')}>
                Multiplayer
              </button>
            </li>
            <li>
              <button className="menu-button">Leaderboards</button>
            </li>
            <li>
              <button className="menu-button secondary">Quit</button>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
};

export default MainMenu;