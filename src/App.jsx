import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import io from 'socket.io-client';

// Prefer VITE_SERVER_URL at build time; otherwise use current page origin
const SERVER_URL = import.meta.env.VITE_SERVER_URL || window.location.origin;
console.log('Connecting to server at:', SERVER_URL);

const socket = io(SERVER_URL, {
  transports: ['websocket'],
  withCredentials: true,
});

export default function App() {
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Socket connected', socket.id);
    });
    socket.on('connect_error', (err) => {
      console.error('Socket connect_error', err);
    });
    return () => {
      socket.off();
      socket.close();
    };
  }, []);

  return (
    <div className="App">
      <Outlet context={{ socket }} />
    </div>
  );
}