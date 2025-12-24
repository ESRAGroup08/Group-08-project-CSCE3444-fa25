import React from 'react';
import { useNavigate } from 'react-router-dom';
import Scoreboard from '../components/Scoreboard.jsx';

const LeaderboardPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-cyan-400">Global Leaderboard</h1>
          <button
            onClick={() => navigate('/menu')}
            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-md text-white transition"
          >
            ← Back to Menu
          </button>
        </div>
        <Scoreboard />
      </div>
    </div>
  );
};

export default LeaderboardPage;