import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom'; // Import useNavigate
import io from 'socket.io-client';

const getServerURL = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://group-08-project-csce3444-fa25.onrender.com';
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

  useEffect(() => {
    // On mount, check if a user is "logged in" (i.e., has a username in localStorage).
    // If not, redirect them to the login page.
    const storedUsername = localStorage.getItem('username');
    if (!storedUsername) {
        // If we are not already at the root path, redirect to login.
        if (window.location.hash !== '#/') {
             navigate('/');
        }
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
  }, [navigate]); // Add navigate to dependency array

  return (
    <div className="App">
      <Outlet context={{ socket, isConnected }} />
    </div>
  );
}

export default App;