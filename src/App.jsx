import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

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
      <Outlet context={{ socket, isConnected }} />
    </div>
  );
}

export default App;