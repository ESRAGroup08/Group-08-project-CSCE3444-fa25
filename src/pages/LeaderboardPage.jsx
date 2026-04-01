import React from 'react';
import { useNavigate } from 'react-router-dom';
import Scoreboard from '../components/Scoreboard.jsx';

const LeaderboardPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-transparent text-white p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl bg-black/40 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">LEADERBOARD</h1>
          <button
            onClick={() => navigate('/menu')}
            className="bg-white/5 hover:bg-white/10 px-6 py-2 rounded-xl text-white transition-all border border-white/10 hover:border-white/20 uppercase font-bold tracking-widest text-sm"
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