import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MainMenu.css';
import './Modal.css';

const CustomLobby = () => {
  const navigate = useNavigate();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  const handleCreateRoom = () => {
    alert("Attempting to create a new room...");
  };

  const handleJoinWithCode = () => {
    setShowJoinModal(true);
  };

  const handleSubmitJoin = () => {
    alert(`Attempting to join room: ${joinCode}`);
    setShowJoinModal(false);
  };

  const handleBack = () => {
    navigate(-1);
  };

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