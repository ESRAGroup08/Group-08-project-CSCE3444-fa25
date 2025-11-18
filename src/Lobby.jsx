import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import './components/MainMenu.css';

const Lobby = () => {
  const navigate = useNavigate();
  const { socket } = useOutletContext();
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // --- Effect to initialize user on socket connection ---
  useEffect(() => {
    if (!socket) {
      console.log('CLIENT: Lobby waiting for socket connection...');
      return;
    }

    // Initialize user with the server
    const initializeUser = () => {
      // This is a temporary way to get a username. In a real app, this would come from a login or context.
      const username = `Player_${Math.random().toString(36).substring(2, 8)}`;
      const stats = { wpm: 0, accuracy: 0, winRate: 0, gamesPlayed: 0 };

      console.log('CLIENT: Emitting "user:init" to initialize session with username:', username);
      socket.emit('user:init', { username, stats });
      setIsInitialized(true);
    };

    // If socket is already connected, initialize immediately
    if (socket.connected) {
      initializeUser();
    }

    // Also listen for connection events in case socket reconnects
    const onConnect = () => {
      console.log('CLIENT: Socket reconnected, initializing user...');
      initializeUser();
    };

    socket.on('connect', onConnect);

    return () => {
      socket.off('connect', onConnect);
    };
  }, [socket]);


  // --- Effect to manage main game event listeners ---
  useEffect(() => {
    if (socket) {
      // Listen for when the server finds a match and starts the game
      const handleGameStart = (data) => {
        console.log("Client received 'game:start'", data);
        setWaiting(false); // No longer waiting
        navigate(`/game/${data.gameType}/${data.roomId}`, { state: { players: data.players } });
      };

      // Listen for when we are successfully added to the queue
      const handleEnqueued = () => {
        console.log("Client received 'casual:enqueued', now waiting for a match.");
        setWaiting(true);
      };

      // Listen for any errors from the server
      const handleError = (errorData) => {
        console.error("Server error:", errorData.message);
        setError(errorData.message);
        setWaiting(false); // Stop waiting if there was an error
      };

      // Set up listeners
      socket.on('game:start', handleGameStart);
      socket.on('casual:enqueued', handleEnqueued);
      socket.on('error', handleError);

      // Cleanup function to remove listeners when the component unmounts
      return () => {
        socket.off('game:start', handleGameStart);
        socket.off('casual:enqueued', handleEnqueued);
        socket.off('error', handleError);
      };
    }
  }, [socket, navigate]);


  const handleCasualClick = () => {
    if (!socket || !socket.connected) {
      console.error('CLIENT: Socket not connected. Cannot send event.');
      alert('Not connected to the server. Please refresh the page.');
      return;
    }

    if (!isInitialized) {
      console.error('CLIENT: User not initialized. Cannot enqueue.');
      alert('Please wait for initialization to complete.');
      return;
    }

    console.log('CLIENT: Emitting "casual:enqueue" to the server.');
    socket.emit("casual:enqueue");
    setWaiting(true);
    setError(''); // Clear previous errors
  };

  const handleRanked = () => {
    alert("Ranked matchmaking is not yet implemented.");
  };

  const handleCustomPlay = () => {
    navigate('/lobby/custom');
  };

  return (
    <div className="main-menu-container">
      <nav className="main-navigation">
        {waiting ? (
          <div>
            <p className="waiting-text">Waiting for opponent...</p>
            <p className="sub-text">The server is looking for another player.</p>
          </div>
        ) : (
          <ul>
            <li>
              <button className="menu-button" onClick={handleCustomPlay}>
                Custom Play
              </button>
            </li>
            <li>
              <button className="menu-button" onClick={handleCasualClick}>
                Casual
              </button>
            </li>
            <li>
              <button className="menu-button" onClick={handleRanked}>
                Ranked
              </button>
            </li>
            <li>
              <button className="menu-button secondary" onClick={() => navigate('/menu')}>
                Back
              </button>
            </li>
          </ul>
        )}
        {error && <p style={{ color: 'red', marginTop: '1em' }}>Error: {error}</p>}
      </nav>
    </div>
  );
};

export default Lobby;