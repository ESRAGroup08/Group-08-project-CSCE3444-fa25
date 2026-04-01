import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import AnimatedBackground from './components/AnimatedBackground';
import { applyTheme } from './utils.js';

// Use current window origin for socket connection
const getServerURL = () => {
  // If we are in the browser, using "" or window.location.origin 
  // ensures we connect to the server that served the page.
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:3000';
};

const SERVER_URL = getServerURL();

const socket = io(SERVER_URL, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
  transports: ['websocket', 'polling']
});

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const navigate = useNavigate();
  const location = useLocation();

  const isLoginPage = location.pathname === '/';
  const isGamePage = location.pathname.startsWith('/game/');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('gameSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.theme) applyTheme(parsed.theme);
      } else {
        applyTheme('dark'); // Default
      }
    } catch (e) {
      applyTheme('dark');
    }
  }, []);

  useEffect(() => {
    // MERGED: Kept our simplified auth check
    const storedUsername = localStorage.getItem('username');
    if (!storedUsername && window.location.hash !== '#/') {
      navigate('/');
    }

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    const onConnectError = (err) => console.error('WebSocket Connection Error:', err.message);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
    };
  }, [navigate]);

  return (
    <div className="App">
      {!isLoginPage && <AnimatedBackground />}
      <Outlet context={{ socket, isConnected }} />
    </div>
  );
}

export default App;