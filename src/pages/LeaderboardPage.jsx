import React from 'react';
import { useNavigate } from 'react-router-dom';

const LeaderboardPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ color: 'white', padding: '2rem' }}>
      <h1>Global Leaderboard</h1>
      <p>This page is under construction. It will show the top players.</p>
      
      <button 
        onClick={() => navigate('/menu')} 
        style={{ marginTop: '1rem', color: 'black' }}
      >
        Back to Menu
      </button>
    </div>
  );
};

export default LeaderboardPage;