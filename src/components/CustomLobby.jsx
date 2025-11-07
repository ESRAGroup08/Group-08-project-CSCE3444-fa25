import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MainMenu.css';
import './Modal.css';

const CustomLobby = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="main-menu-container">
        <nav className="main-navigation">
          <ul>
            <li>
              <button className="menu-button">Create Room</button>
            </li>
            <li>
              <button className="menu-button" onClick={() => setShowModal(true)}>
                Join with Code
              </button>
            </li>
            <li>
              <button className="menu-button secondary" onClick={() => navigate('/lobby')}>
                Back
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Join with Code</h2>
            <input type="text" placeholder="Enter code" />
            <button>Submit</button>
            <button onClick={() => setShowModal(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
};

export default CustomLobby;