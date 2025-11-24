import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import io from 'socket.io-client';

// --- THIS IS THE FIX ---
// Determine the server URL based on the environment
const SERVER_URL = process.env.NODE_ENV === 'production' 
  ? 'https://group-08-project-csce3444-fa25.onrender.com' // Your live Render URL
  : 'http://localhost:3000';                              // Your local development URL

console.log("--- App.jsx is loading ---");
console.log(`Attempting to connect to WebSocket server at: ${SERVER_URL}`);

// Initialize the socket connection
const socket = io({
  transports: ['websocket', 'polling']
});

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    // For development: generate a random username if one doesn't exist
    if (!localStorage.getItem('username')) {
      const randomId = Math.floor(Math.random() * 1000);
      const guestName = `TestPlayer_${randomId}`;
      localStorage.setItem('username', guestName);
      console.log(`Bypassing login. Setting username to: ${guestName}`);
    }

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

    // Clean up the connection on component unmount
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
    };
  }, []);

  return (
    <div className="App">
      {/* Pass the socket instance to all child routes */}
      <Outlet context={{ socket, isConnected }} />
    </div>
  );
}

export default App;