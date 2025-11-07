import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import './components/MainMenu.css';

const Lobby = () => {
  const navigate = useNavigate();
  const { socket } = useOutletContext();
  const [waiting, setWaiting] = useState(false);

  const handleCasualClick = () => {
    socket.emit("join_casual");
    setWaiting(true);
  };

  const handleRanked = () => {
    alert("Searching for a ranked match...");
  };

  const handleCustomPlay = () => {
    navigate('/lobby/custom');
  };

  useEffect(() => {
    if (socket) {
      socket.on("match_found", (data) => {
        navigate(`/game/${data.roomId}`);
      });
    }

    return () => {
      if (socket) {
        socket.off("match_found");
      }
    };
  }, [socket, navigate]);

  return (
    <div className="main-menu-container">
      <nav className="main-navigation">
        {waiting ? (
          <p>Waiting for opponent...</p>
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