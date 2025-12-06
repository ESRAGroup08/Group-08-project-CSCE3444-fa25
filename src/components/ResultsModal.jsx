import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Award, TrendingUp, TrendingDown } from 'lucide-react';

const ResultsModal = ({ players, isRanked }) => {
  const sortedPlayers = Object.values(players).sort((a, b) => b.wpm - a.wpm);
  const winner = sortedPlayers[0];

  return (
    <AnimatePresence>
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-gray-800 border-2 border-cyan-500 rounded-2xl shadow-2xl w-full max-w-2xl text-white p-8"
          initial={{ scale: 0.8, y: -50, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 120 }}
        >
          <div className="text-center mb-6">
            <h1 className="text-5xl font-bold text-cyan-300">Game Over</h1>
            <div className="flex items-center justify-center gap-3 mt-4 text-2xl">
              <Award className="text-yellow-400" size={30} />
              <span className="font-bold">{winner.username}</span> wins!
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b-2 border-gray-600">
                <tr>
                  <th className="p-3 text-lg">Player</th>
                  <th className="p-3 text-lg text-center">WPM</th>
                  <th className="p-3 text-lg text-center">Accuracy</th>
                  {/* --- NEW: Conditionally render ELO column header --- */}
                  {isRanked && <th className="p-3 text-lg text-center">ELO Change</th>}
                </tr>
              </thead>
              <tbody>
                {sortedPlayers.map((player) => {
                  const eloChange = player.newElo ? player.newElo - player.rank : null;

                  return (
                    <tr key={player.username} className="border-t border-gray-700">
                      <td className="p-4 text-xl font-semibold">{player.username}</td>
                      <td className="p-4 text-xl text-center">{player.wpm}</td>
                      <td className="p-4 text-xl text-center">{player.accuracy}%</td>
                      
                      {/* --- NEW: Conditionally render ELO data for each player --- */}
                      {isRanked && (
                        <td className="p-4 text-xl text-center font-mono">
                          {eloChange !== null ? (
                            <div className="flex items-center justify-center gap-2">
                              <span>{player.rank}</span>
                              <span className={eloChange >= 0 ? 'text-green-400' : 'text-red-500'}>
                                ({eloChange >= 0 ? '+' : ''}{eloChange})
                              </span>
                              {eloChange >= 0 ? <TrendingUp size={20} className="text-green-500"/> : <TrendingDown size={20} className="text-red-600"/>}
                              <span>→ {player.newElo}</span>
                            </div>
                          ) : (
                            <span>--</span> // Show placeholder if data isn't available
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-8 text-center">
            <Link 
              to="/menu" 
              className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xl px-12 py-3 rounded-lg transition-transform transform hover:scale-105"
            >
              Return to Menu
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ResultsModal;