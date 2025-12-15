import React from 'react';
import { useNavigate } from 'react-router-dom';
import Scoreboard from '../components/Scoreboard.jsx';

const LeaderboardPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ color: 'var(--text-primary, white)' }}>Global Leaderboard</h1>
      <Scoreboard />

      <button
        onClick={() => navigate('/menu')}
        style={{ marginTop: '1rem', color: 'var(--text-primary, black)' }}
      >
        Back to Menu
      </button>
    </div>
  );
};

export default LeaderboardPage;