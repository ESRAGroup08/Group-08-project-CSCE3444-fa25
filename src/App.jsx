import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
console.log(`Connecting to server at: ${SERVER_URL}`);

const socket = io(SERVER_URL, {
  transports: ['websocket'],
  withCredentials: true
});

// This mock user should be replaced with real login data in your app.
const mockUser = {
  username: `Player_${Math.round(Math.random() * 1000)}`,
  stats: { wpm: 75, accuracy: 95, winRate: 0.5 },
};

// A new layout component that has access to router hooks like useNavigate.
const AppLayout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // === Centralized Event Listeners ===

    // 1. Listen for when a match is successfully found
    const onMatchFound = (gameData) => {
      console.log("Match found! Navigating to game...", gameData);
      // Navigate to the game screen with the room ID.
      // We also pass the full gameData object in the route's state.
      navigate(`/game/${gameData.roomId}`, { state: { gameData } });
    };

    // 2. Listen for any errors from the server
    const onError = (error) => {
      console.error("Server error:", error.message);
      alert(`An error occurred: ${error.message}`);
      // Optional: navigate back to the menu on a critical error
      navigate('/lobby');
    };

    socket.on('game:start', onMatchFound);
    socket.on('error', onError);

    // Cleanup function to remove listeners when the app closes
    return () => {
      socket.off('game:start', onMatchFound);
      socket.off('error', onError);
    };
  }, [navigate]); // Rerun this effect if `navigate` changes

  // The Outlet renders the current route's component (Lobby, Game, etc.)
  // We pass the socket down through the context.
  return <Outlet context={{ socket }} />;
};


function App() {
  useEffect(() => {
    // Connect to the socket server when the app starts
    socket.connect();
    // Identify the user to the server
    socket.emit('user:init', mockUser);
    console.log(`User ${mockUser.username} initialized with server.`);

    // Disconnect when the browser tab is closed
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="App">
      <AppLayout />
    </div>
  );
}

export default App;