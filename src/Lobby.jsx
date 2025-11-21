import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import './components/MainMenu.css';

const Lobby = () => {
  const navigate = useNavigate();
  const { socket } = useOutletContext();
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState('');

  const handleCasualClick = () => {
    const username = localStorage.getItem('username');
    if (!username) {
      setError("You must be logged in to play.");
      return;
    }
    socket.emit("join_casual", { username });
    setWaiting(true);
    setError('');
  };

  const handleRanked = () => {
    alert("Searching for a ranked match...");
  };

  const handleCustomPlay = () => {
    navigate('/lobby/custom');
  };

  useEffect(() => {
    if (socket) {
      // Listen for when the server finds a match
      socket.on("match_found", (data) => {
        // When a match is found, navigate to the game room, passing the game data
        console.log("Match found!", data);
        navigate(`/game/${data.roomId}`, { state: { gameData: data } });
      });
      
      // Listen for the waiting event
      socket.on("waiting_for_match", () => {
        console.log("Waiting in queue...");
        setWaiting(true);
      });

      // Listen for any errors from matchmaking
      socket.on("matchmaking_error", (data) => {
        setError(data.message);
        setWaiting(false);
      });
    }

    // Clean up listeners when the component unmounts
    return () => {
      if (socket) {
        socket.off("match_found");
        socket.off("waiting_for_match");
        socket.off("matchmaking_error");
      }
    };
  }, [socket, navigate]);

  return (
    <div className="main-menu-container">
      <nav className="main-navigation">
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {waiting ? (
          <div>
            <p className="text-xl text-cyan-400 animate-pulse">Waiting for an opponent...</p>
            {/* Optional: Add a cancel button */}
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