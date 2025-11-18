import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import './components/MainMenu.css';

const Lobby = () => {
  const navigate = useNavigate();
  const { socket } = useOutletContext();
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState(''); // To display any errors from the server

  // This function now emits the correct "casual:enqueue" event
  const handleCasualClick = () => {
    if (socket) {
      console.log('Client emitting "casual:enqueue"');
      socket.emit("casual:enqueue");
      setWaiting(true);
      setError(''); // Clear previous errors
    }
  };

  const handleRanked = () => {
    alert("Ranked matchmaking is not yet implemented.");
  };

  const handleCustomPlay = () => {
    navigate('/lobby/custom');
  };

  useEffect(() => {
    if (socket) {
      // Correctly listen for the "game:start" event from the server
      const handleGameStart = (data) => {
        console.log("Client received 'game:start'", data);
        setWaiting(false); // No longer waiting
        // Navigate to the game room, passing players' info in the state
        navigate(`/game/${data.gameType}/${data.roomId}`, { state: { players: data.players } });
      };

      // Listen for when we are successfully added to the queue
      const handleEnqueued = () => {
        console.log("Client received 'casual:enqueued', now waiting for a match.");
        setWaiting(true);
      };

      // Listen for any errors from the server (like the "username not set" error)
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