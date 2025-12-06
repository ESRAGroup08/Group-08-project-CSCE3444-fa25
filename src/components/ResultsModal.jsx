import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

const ResultsModal = ({ players, myPlayerId, playerResult }) => {
  const navigate = useNavigate();

  if (!players) return null;

  // Convert players map to an array and sort to determine the winner
  const sortedPlayers = Object.entries(players)
    .map(([playerId, player]) => ({
      ...player,
      playerId,
      isMe: playerId === myPlayerId
    }))
    .filter(p => p) // Filter out null/undefined players
    .sort((a, b) => {
      if (a.finished && !b.finished) return -1;
      if (!a.finished && b.finished) return 1;
      if (a.finished && b.finished) return b.wpm - a.wpm;
      return b.progress - a.progress;
    });

  const winner = sortedPlayers[0];
  const isIWon = playerResult === 'won';

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
          {isIWon ? (
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
          {sortedPlayers.map((player, index) => {
            const isMe = player.isMe;
            let rowClass = 'bg-gray-700/50';
            
            if (isMe && isIWon) {
              rowClass = 'bg-yellow-500/20 border-2 border-yellow-400 scale-105';
            } else if (isMe && !isIWon) {
              rowClass = 'bg-red-500/10 border border-red-500';
            }

            return (
              <motion.div 
                key={player.playerId} 
                className={`p-3 rounded-lg flex items-center justify-between transition-all ${rowClass}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * (index + 1) }}
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg w-6">{index + 1}.</span>
                  <span className="text-lg font-semibold">{player.username}</span>
                  {isMe && (
                    <span className={`text-xs px-2 py-1 rounded font-bold ml-2 ${
                      isIWon 
                        ? 'bg-yellow-400 text-black' 
                        : 'bg-red-400 text-white'
                    }`}>
                      YOU
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-bold text-cyan-300">{Math.round(player.wpm || 0)} WPM</div>
                  

                </div>
              </motion.div>
            );
          })}
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