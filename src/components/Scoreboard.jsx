import React, { useState, useEffect } from 'react';

const Scoreboard = () => {
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('/api/leaderboard');
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard data.');
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

  if (isLoading) {
    return <div className="text-center text-cyan-300">Loading leaderboard...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="bg-gray-800 shadow-lg rounded-lg overflow-hidden">
      <table className="min-w-full text-left">
        <thead className="bg-gray-700">
          <tr>
            <th className="p-4 text-lg font-semibold text-gray-300">Rank</th>
            <th className="p-4 text-lg font-semibold text-gray-300">Player</th>
            <th className="p-4 text-lg font-semibold text-gray-300">Rating (ELO)</th>
            <th className="p-4 text-lg font-semibold text-gray-300 hidden sm:table-cell">Games Played</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player, index) => (
            <tr key={player._id} className="border-b border-gray-700 hover:bg-gray-700/50">
              <td className="p-4 text-xl font-bold">{index + 1}</td>
              <td className="p-4 text-xl text-cyan-400">{player.username}</td>
              <td className="p-4 text-xl font-medium">{player.rating}</td>
              <td className="p-4 text-lg text-gray-400 hidden sm:table-cell">{player.gamesPlayed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Scoreboard;