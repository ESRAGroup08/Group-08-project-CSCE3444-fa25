import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import io from 'socket.io-client';

// Prefer VITE_SERVER_URL, otherwise current origin
const SERVER_URL = import.meta.env.VITE_SERVER_URL || window.location.origin;
console.log('Connecting to server at:', SERVER_URL);

const socket = io(SERVER_URL, {
  transports: ['websocket'],
  withCredentials: true,
});

// --- TEMP DEBUG: expose socket on window for manual testing ---
window.__GT_SOCKET = socket;

export default function App() {
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Socket connected', socket.id);
    });
    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });
    socket.on('connect_error', (err) => {
      console.error('Socket connect_error', err);
    });

    // Listen for matchmaking responses (example)
    socket.on('casual:enqueued', () => {
      console.log('CLIENT: received casual:enqueued from server');
    });
    socket.on('game:start', (payload) => {
      console.log('CLIENT: received game:start', payload);
    });
    socket.on('error', (err) => {
      console.warn('Socket error event:', err);
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