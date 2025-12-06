import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const LeaderboardPage = () => {
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('/api/leaderboard');
        if (!response.ok) {
          throw new Error('Could not fetch leaderboard data.');
        }
        const data = await response.json();
        setPlayers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-5xl font-bold mb-2">🏆 Global Leaderboard</h1>
            <p className="text-gray-400">Top 25 players by ELO rating.</p>
          </div>
          <Link to="/menu" className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-md text-white transition">
            ← Back to Menu
          </Link>
        </div>

        {isLoading && <div className="text-center text-xl">Loading leaderboard...</div>}
        {error && <div className="text-center text-red-500 text-xl">{error}</div>}

        {!isLoading && !error && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="p-4 text-lg font-bold w-16 text-center">#</th>
                  <th className="p-4 text-lg font-bold">Player</th>
                  <th className="p-4 text-lg font-bold text-right">ELO Rating</th>
                  <th className="p-4 text-lg font-bold text-right">Average WPM</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player, index) => (
                  <tr key={player._id} className="border-t border-gray-700 hover:bg-gray-700/40">
                    <td className="p-4 font-bold text-xl text-center">{index + 1}</td>
                    <td className="p-4 text-lg">{player.username}</td>
                    <td className="p-4 text-lg font-bold text-cyan-400 text-right">{player.eloRating}</td>
                    <td className="p-4 text-lg text-gray-300 text-right">{player.averageWPM.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;