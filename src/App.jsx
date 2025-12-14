import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import { applyTheme } from './utils.js';

// --- THIS IS THE FIX ---
// Determine the server URL based on the environment
const getServerURL = () => {
  // Check the browser's current URL
  const hostname = window.location.hostname;

  // If we are on localhost (dev or docker), connect to local server
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }

  // Otherwise, we are on the live internet (Render)
  return 'https://group-08-project-csce3444-fa25.onrender.com';
};

const SERVER_URL = getServerURL();

console.log("--- App.jsx is loading ---");
console.log(`Attempting to connect to WebSocket server at: ${SERVER_URL}`);

// Initialize the socket connection with explicit URL and options
const socket = io(SERVER_URL, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
  transports: ['websocket', 'polling'],
  withCredentials: true
});

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Apply saved theme on app startup so theme persists globally
    try {
      const saved = localStorage.getItem('gameSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.theme) applyTheme(parsed.theme);
      }
    } catch (e) {
      // ignore parse errors
    }

    const checkAuthStatus = async () => {
      try {
        const response = await fetch(`${SERVER_URL}/api/auth/status`);
        const data = await response.json();
        if (data.isAuthenticated) {
          setUser(data.user);
          console.log('User is authenticated:', data.user);
        } else {
          console.log('User is not authenticated.');
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      }
    };

    checkAuthStatus();

    const onConnect = () => {
      console.log('✅ Connected to WebSocket server!');
      setIsConnected(true);
    };

    const onDisconnect = () => {
      console.log('🔌 Disconnected from WebSocket server.');
      setIsConnected(false);
    };

    const onConnectError = (err) => {
        console.error('❌ FAILED to connect to WebSocket server:', err.message);
        console.error('Full error object:', err);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
    };
  }, []);

  return (
    <div className="App">
      <Outlet context={{ socket, isConnected, user, setUser }} />
    </div>
  );
}

export default App;