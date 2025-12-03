import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Trophy, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const ResultsModal = ({ players, myPlayerId, playerResult }) => {
  const navigate = useNavigate();

  if (!players) return null;

  // Convert players map to an array and sort to determine the winner
  const sortedPlayers = Object.values(players)
    .filter(p => p) // Filter out null/undefined players
    .sort((a, b) => {
      if (a.finished && !b.finished) return -1;
      if (!a.finished && b.finished) return 1;
      if (a.finished && b.finished) return b.wpm - a.wpm;
      return b.progress - a.progress;
    });

  const winner = sortedPlayers[0];
  const myPlayer = sortedPlayers.find(p => p.username === Object.values(players).find(pl => pl.socket?.id === myPlayerId)?.username) || sortedPlayers[0];

  return (
    <motion.div 
      className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div 
        className="w-full max-w-lg bg-gray-800/90 border-2 border-cyan-500/50 rounded-lg p-8 text-white"
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.4, type: "spring", stiffness: 100 }}
      >
        <div className="text-center">
          {playerResult === 'won' ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
            >
              <div className="flex items-center justify-center gap-3 text-5xl font-bold mb-6">
                <Trophy className="w-12 h-12 text-yellow-400 animate-bounce" />
                <span className="text-yellow-400">YOU WON!</span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
            >
              <h2 className="text-4xl font-bold mb-3 text-red-400">YOU LOST!</h2>
              <div className="flex items-center justify-center gap-3 text-2xl text-yellow-400 font-bold mb-6">
                <Crown className="w-8 h-8" />
                <span>{winner.username} wins!</span>
              </div>
            </motion.div>
          )}
        </div>

        <div className="space-y-3">
          {sortedPlayers.map((player, index) => (
            <motion.div 
              key={player.username} 
              className={`p-3 rounded-lg flex items-center justify-between transition-all ${
                playerResult === 'won' && index === 0
                  ? 'bg-yellow-500/20 border-2 border-yellow-400 scale-105'
                  : playerResult === 'lost' && index === 0
                  ? 'bg-red-500/10 border border-red-500'
                  : 'bg-gray-700/50'
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * (index + 1) }}
            >
              <div className="flex items-center gap-3">
                <span className="font-bold text-lg w-6">{index + 1}.</span>
                <span className="text-lg font-semibold">{player.username}</span>
                {index === 0 && playerResult === 'won' && (
                  <span className="text-xs bg-yellow-400 text-black px-2 py-1 rounded font-bold ml-2">YOU</span>
                )}
                {index === 0 && playerResult === 'lost' && (
                  <span className="text-xs bg-red-400 text-white px-2 py-1 rounded font-bold ml-2">YOU</span>
                )}
              </div>
              <div className="text-right">
                <div className="font-bold text-cyan-300">{player.wpm} WPM</div>
                
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
            </motion.div>
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
      </motion.div>
    </motion.div>
  );
};

export default ResultsModal;