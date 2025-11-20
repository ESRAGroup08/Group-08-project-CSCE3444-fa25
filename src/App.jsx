import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import io from 'socket.io-client';

const SERVER_URL = 'https://group-08-project.onrender.com';
console.log('Connecting to server at:', SERVER_URL);

// Simplified connection for better compatibility
const socket = io(SERVER_URL, {
  transports: ['websocket'],
});

window.__GT_SOCKET = socket;

export default function App() {
  // Add state for the current user
  const [user, setUser] = useState(null);

  useEffect(() => {
    // A function to initialize the user and socket
    const initUser = (userData) => {
      setUser(userData);
      socket.emit('user:init', { username: userData.username, stats: userData.stats });
    };

    // Example: try to load user from localStorage on startup
    const savedUser = localStorage.getItem('galactic_typer_user');
    if (savedUser) {
      initUser(JSON.parse(savedUser));
    }
    
    // Pass the initUser function down to be used by the Login component
    // This part is a conceptual fix; the Login component would need to be updated to use this.
    // For now, we will pass both socket and user in the context.

    socket.on('connect', () => console.log('Socket connected', socket.id));
    socket.on('disconnect', (reason) => console.log('Socket disconnected:', reason));
    socket.on('connect_error', (err) => console.error('Socket connect_error', err));
    
    // ... other socket listeners

    return () => {
      socket.off();
    };
  }, []);

  // Pass both socket and user down to child routes
  return (
    <div className="App">
      <Outlet context={{ socket, user, setUser }} />
    </div>
  );
}