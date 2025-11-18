import React, { useEffect, useState } from 'react';
import './MainMenu.css';
import { useNavigate, Link, useOutletContext } from 'react-router-dom';
import Header from './Header.jsx';

const MainMenu = () => {
  const navigate = useNavigate();
  // Try to get socket from Outlet context (App should pass it). Fallback to window.__GT_SOCKET for compatibility.
  const outlet = useOutletContext?.();
  const socket = outlet ? outlet.socket : (window.__GT_SOCKET || null);

  const [username, setUsername] = useState(() => localStorage.getItem('username'));
  const [connected, setConnected] = useState(socket ? socket.connected : false);

  useEffect(() => {
    function onConnect() { setConnected(true); }
    function onDisconnect() { setConnected(false); }

    if (!socket) return;

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // If a username exists in localStorage and socket is connected, ensure user:init is emitted
    const stored = localStorage.getItem('username');
    if (stored && socket.connected) {
      console.log('CLIENT (MainMenu): emitting user:init for', stored);
      socket.emit('user:init', { username: stored, stats: {} });
      setUsername(stored);
    }

    function onStorage(e) {
      if (e.key === 'username') {
        setUsername(e.newValue);
        if (e.newValue && socket.connected) {
          console.log('CLIENT (MainMenu): detected username set, emitting user:init for', e.newValue);
          socket.emit('user:init', { username: e.newValue, stats: {} });
        }
      }
    }
    window.addEventListener('storage', onStorage);

    return () => {
      if (!socket) return;
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      window.removeEventListener('storage', onStorage);
    };
  }, [socket]);

  const handleMultiplayer = () => {
    if (!username) {
      console.warn('Multiplayer: username not set');
      alert('Please set a username (Profile) before entering multiplayer.');
      return;
    }
    if (!connected) {
      console.warn('Multiplayer: socket not connected');
      alert('Connecting to server — please wait a moment and try again.');
      return;
    }

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
              <button className="menu-button" onClick={handleMultiplayer} disabled={!username || !connected}>
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
              <Link to="/friends" className="menu-button">
                FRIENDS
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
      {/* Helpful hints shown below the menu */}
      <div style={{ textAlign: 'center', marginTop: '12px' }}>
        {!username && <div className="hint">Please set a username in Profile to enable multiplayer.</div>}
        {username && !connected && <div className="hint">Connecting to server…</div>}
      </div>
    </>
  );
};

export default MainMenu;