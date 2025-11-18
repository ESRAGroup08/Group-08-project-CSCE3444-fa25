import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import './components/MainMenu.css';

const Lobby = () => {
  const navigate = useNavigate();
  const { socket } = useOutletContext();
  const [isWaiting, setIsWaiting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // --- Click handler for the "Casual" button ---
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
  };

  const handleRanked = () => {
    alert("This feature is coming soon!");
  };

  const handleCustomPlay = () => {
    navigate('/lobby/custom');
  };

  // --- Effect to initialize user on socket connection ---
  useEffect(() => {
    if (!socket) {
      console.log('CLIENT: Lobby waiting for socket connection...');
      return;
    }

    // Initialize user with the server
    const initializeUser = () => {
      // Generate a default username (in a real app, this would come from login/profile)
      const username = `Player_${Math.random().toString(36).substring(2, 8)}`;
      const stats = {
        wpm: 0,
        accuracy: 0,
        winRate: 0,
        gamesPlayed: 0
      };

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
      console.log('CLIENT: Socket connected, initializing user...');
      initializeUser();
    };

    socket.on('connect', onConnect);

    return () => {
      socket.off('connect', onConnect);
    };
  }, [socket]);

  // --- Effect to manage socket event listeners ---
  useEffect(() => {
    // Don't set up listeners if the socket isn't ready
    if (!socket) {
      console.log('CLIENT: Lobby waiting for socket connection...');
      return;
    }

    console.log('CLIENT: Lobby component mounted. Setting up listeners.');

    // Define the function that will run when the server confirms we're in the queue.
    const onEnqueued = () => {
      console.log('CLIENT: Received "casual:enqueued" from server. Updating UI to show waiting status.');
      setIsWaiting(true);
    };

    // Attach the listener
    socket.on("casual:enqueued", onEnqueued);

    // This is the cleanup function. It runs when the component is unmounted.
    // It's crucial for preventing memory leaks and duplicate listeners.
    return () => {
      console.log('CLIENT: Lobby component unmounting. Cleaning up listeners.');
      socket.off("casual:enqueued", onEnqueued);
    };
  }, [socket]); // This effect re-runs if the socket object ever changes.

  return (
    <div className="main-menu-container">
      <nav className="main-navigation">
        {isWaiting ? (
          <div>
            <h2 className="text-2xl font-bold">Waiting for opponent...</h2>
            <p>The server is looking for another player.</p>
            {/* Optional: Add a "Cancel" button that emits 'casual:dequeue' */}
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
      </nav>
    </div>
  );
};

export default Lobby;