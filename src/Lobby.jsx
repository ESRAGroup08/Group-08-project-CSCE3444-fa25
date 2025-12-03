import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router-dom';

const Lobby = () => {
  const { socket } = useOutletContext();
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle'); // 'idle', 'waiting', 'matched'
  const [error, setError] = useState('');

  useEffect(() => {
    if (!socket) return;

    const handleWaiting = () => {
      setStatus('waiting');
      setError('');
    };

    const handleMatchFound = (gameData) => {
      setStatus('matched');
      // This correctly passes the game data to the Game component for any match type
      navigate(`/game/${gameData.roomId}`, { state: { ...gameData } });
    };

    const handleMatchmakingError = (data) => {
      setStatus('idle');
      setError(data.message || 'An unknown error occurred.');
    };

    socket.on('waiting_for_match', handleWaiting);
    socket.on('match_found', handleMatchFound);
    socket.on('matchmaking_error', handleMatchmakingError);

    return () => {
      socket.off('waiting_for_match', handleWaiting);
      socket.off('match_found', handleMatchFound);
      socket.off('matchmaking_error', handleMatchmakingError);
    };
  }, [socket, navigate]);

  const handleJoinCasual = () => {
    const username = localStorage.getItem('username');
    if (username) {
      socket.emit('join_casual', { username });
    } else {
      setError('Cannot join without a username. Please log in again.');
    }
  };

  // --- NEW: Handler for Ranked Matches ---
  const handleJoinRanked = () => {
    const username = localStorage.getItem('username');
    // The client only needs to send the username.
    // The server will look up the player's rank.
    if (username) {
      socket.emit('join_ranked', { username });
    } else {
      setError('Cannot join without a username. Please log in again.');
    }
  };

  if (status === 'waiting') {
    return (
      <div className="w-full h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
        <h2 className="text-4xl font-bold mb-4">Searching for Opponent...</h2>
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500"></div>
        <p className="text-slate-400 mt-4">Finding a worthy adversary...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
        <div className="absolute top-8 left-8">
            <Link to="/menu" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                Back to Menu
            </Link>
        </div>
      <h1 className="text-5xl font-bold mb-12">Multiplayer</h1>
      <div className="w-full max-w-sm flex flex-col gap-6">
        <button
          onClick={handleJoinRanked}
          className="w-full bg-red-600 hover:bg-red-500 text-white font-bold text-2xl py-4 rounded-lg transition-all"
        >
          Find Ranked Match
        </button>
        <button
          onClick={handleJoinCasual}
          className="w-full bg-teal-500 hover:bg-teal-400 text-white font-bold text-2xl py-4 rounded-lg transition-all"
        >
          Find Casual Match
        </button>
        <button
          onClick={() => navigate('/lobby/custom')}
          className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-2xl py-4 rounded-lg transition-all"
        >
          Custom Lobby
        </button>
        {error && <p className="text-red-500 text-center mt-2">{error}</p>}
      </div>
    </div>
  );
};

export default Lobby;