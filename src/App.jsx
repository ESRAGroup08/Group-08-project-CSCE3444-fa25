import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import io from 'socket.io-client';

// --- THIS IS THE FIX ---
// Determine the server URL based on the environment
const getServerURL = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://group-08-project-csce3444-fa25.onrender.com';
  }
  // In development, always use localhost:3000 (the Express server)
  // regardless of what port Vite is running on
  return 'http://localhost:3000';
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