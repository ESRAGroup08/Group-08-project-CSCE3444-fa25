import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown } from 'lucide-react';

const ResultsModal = ({ players }) => {
  const navigate = useNavigate();

  if (!players) return null;

  // Convert players map to an array and sort to determine the winner
  const sortedPlayers = Object.values(players)
    .sort((a, b) => {
      if (a.finished && !b.finished) return -1;
      if (!a.finished && b.finished) return 1;
      if (a.finished && b.finished) return b.wpm - a.wpm;
      return b.progress - a.progress;
    });

  const winner = sortedPlayers[0];

  return (
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="w-full max-w-lg bg-gray-800/90 border-2 border-cyan-500/50 rounded-lg p-8 text-white">
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-2">Game Over!</h2>
          <div className="flex items-center justify-center gap-3 text-2xl text-yellow-400 font-bold mb-6">
            <Crown className="w-8 h-8" />
            <span>{winner.username} wins!</span>
          </div>
        </div>

        <div className="space-y-3">
          {sortedPlayers.map((player, index) => (
            <div key={player.username} className="bg-gray-700/50 p-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-bold text-lg w-6">{index + 1}.</span>
                <span className="text-lg">{player.username}</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-cyan-300">{player.wpm} WPM</div>
                
                {/* --- NEW: Conditional display for Rank or Accuracy --- */}
                {player.newRank !== undefined ? (
                  <div className="text-sm font-bold">
                    <span className="text-slate-400">{player.rank} → </span>
                    <span className={player.newRank > player.rank ? "text-green-400" : "text-red-400"}>
                      {player.newRank}
                    </span>
                  </div>
                ) : (
                  <div className="text-sm text-slate-400">{player.accuracy || 0}% Accuracy</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={() => navigate('/menu')}
            className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xl py-3 px-12 rounded-lg transition-all"
          >
            Return to Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsModal;