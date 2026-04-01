import React, { useState, useEffect } from 'react';

const Scoreboard = () => {
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('/api/leaderboard', { signal: controller.signal });
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard data.');
        }
        const data = await response.json();
        setPlayers(data);
      } catch (err) {
        if (err.name === 'AbortError') {
          setError('Request timed out. Please check your connection or try again later.');
        } else {
          setError(err.message);
        }
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, []);

  if (isLoading) {
    return <div className="text-center text-cyan-300">Loading leaderboard...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/5">
      <table className="min-w-full text-left">
        <thead className="bg-white/10">
          <tr>
            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-cyan-400">Rank</th>
            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-cyan-400">Player</th>
            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-cyan-400">Rating (ELO)</th>
            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-cyan-400 hidden sm:table-cell">Games</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {players.map((player, index) => (
            <tr key={player._id} className="hover:bg-cyan-500/5 transition-colors group">
              <td className="px-6 py-5">
                <span className={`flex items-center justify-center w-8 h-8 rounded-lg font-black text-sm ${
                  index === 0 ? 'bg-yellow-500 text-black' : 
                  index === 1 ? 'bg-slate-300 text-black' : 
                  index === 2 ? 'bg-amber-600 text-black' : 'bg-white/10 text-white'
                }`}>
                  {index + 1}
                </span>
              </td>
              <td className="px-6 py-5 font-bold text-lg group-hover:text-cyan-400 transition-colors">{player.username}</td>
              <td className="px-6 py-5">
                <span className="font-mono text-xl text-cyan-300/90">{player.rating}</span>
              </td>
              <td className="px-6 py-5 hidden sm:table-cell">
                <span className="text-white/40 font-medium">{player.gamesPlayed}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Scoreboard;