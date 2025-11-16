import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import './MainMenu.css';
import './Modal.css';

const CustomLobby = () => {
  const navigate = useNavigate();
  const { socket } = useOutletContext();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');

  const handleCreateRoom = () => {
    socket.emit('create_lobby');
  };

  const handleJoinWithCode = () => {
    setShowJoinModal(true);
  };

  const handleSubmitJoin = () => {
    setError('');
    socket.emit('join_lobby', { roomId: joinCode });
  };

  const handleBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    if (!socket) return;

    // Server sends this on successful join or creation
    const handleLobbySuccess = (data) => {
      navigate(`/game/${data.roomId}`);
    };

    // Server sends this if the room is full or doesn't exist
    const handleLobbyError = (data) => {
      setError(data.message);
    };

    socket.on('lobby_joined', handleLobbySuccess);
    socket.on('lobby_created', handleLobbySuccess);
    socket.on('lobby_error', handleLobbyError);

    return () => {
      socket.off('lobby_joined', handleLobbySuccess);
      socket.off('lobby_created', handleLobbySuccess);
      socket.off('lobby_error', handleLobbyError);
    };
  }, [socket, navigate]);

  return (
    <>
      <div className="main-menu-container">
        <nav className="main-navigation">
          <ul>
            <li>
              <button className="menu-button" onClick={handleCreateRoom}>
                Create Room
              </button>
            </li>
            <li>
              <button className="menu-button" onClick={handleJoinWithCode}>
                Join with Code
              </button>
            </li>
            <li>
              <button className="menu-button secondary" onClick={handleBack}>
                Back
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {showJoinModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Join with Code</h2>
            {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
            <input
              type="text"
              placeholder="Enter code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
            />
            <button onClick={handleSubmitJoin}>Submit</button>
            <button onClick={() => setShowJoinModal(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
};

export default CustomLobby;
