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
    if (status !== 'idle') return;
    const username = localStorage.getItem('username');
    if (username) {
      setStatus('searching'); // New temporary state to show immediate feedback
      socket.emit('join_casual', { username });
    } else {
      setError('Cannot join without a username. Please log in again.');
    }
  };

  const handleJoinRanked = () => {
    if (status !== 'idle') return;
    const username = localStorage.getItem('username');
    if (username) {
      setStatus('searching');
      socket.emit('join_ranked', { username });
    } else {
      setError('Cannot join without a username. Please log in again.');
    }
  };

  const isProcessing = status !== 'idle';

  if (status === 'waiting' || status === 'searching') {
    return (
      <div className="w-full h-screen bg-transparent text-white flex flex-col items-center justify-center">
        <div className="bg-black/40 backdrop-blur-md p-12 rounded-2xl border border-cyan-500/30 flex flex-col items-center shadow-2xl">
          <h2 className="text-4xl font-bold mb-8 animate-pulse">
            {status === 'searching' ? 'Initializing Uplink...' : 'Searching for Opponent...'}
          </h2>
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-xl bg-cyan-500/20 animate-pulse"></div>
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-cyan-500 relative"></div>
          </div>
          <p className="text-cyan-300/70 mt-8 text-xl tracking-widest uppercase">
            {status === 'searching' ? 'Establishing secure connection...' : 'Finding a worthy adversary...'}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-10 text-xs text-white/40 hover:text-white underline uppercase tracking-widest"
          >
            Cancel Mission
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-transparent text-white flex flex-col items-center justify-center p-4">
        <div className="absolute top-8 left-8">
            <Link to="/menu" className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors group">
                <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Menu
            </Link>
        </div>
      <h1 className="text-6xl font-black mb-12 tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-500">MULTIPLAYER</h1>
      <div className="w-full max-w-md flex flex-col gap-6 bg-black/40 backdrop-blur-xl p-10 rounded-3xl border border-white/10 shadow-2xl">
        <button
          onClick={handleJoinRanked}
          disabled={isProcessing}
          className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:from-slate-800 disabled:to-slate-900 disabled:text-white/20 text-white font-black text-2xl py-5 rounded-xl transition-all shadow-lg hover:shadow-red-500/40 hover:-translate-y-1 uppercase tracking-wider"
        >
          {isProcessing ? 'Processing...' : 'Ranked Match'}
        </button>
        <button
          onClick={handleJoinCasual}
          disabled={isProcessing}
          className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 disabled:from-slate-800 disabled:to-slate-900 disabled:text-white/20 text-white font-black text-2xl py-5 rounded-xl transition-all shadow-lg hover:shadow-cyan-500/40 hover:-translate-y-1 uppercase tracking-wider"
        >
          {isProcessing ? 'Connecting...' : 'Casual Match'}
        </button>
        <div className="h-px bg-white/10 my-2"></div>
        <button
          onClick={() => navigate('/lobby/custom')}
          disabled={isProcessing}
          className="w-full bg-white/5 hover:bg-white/10 disabled:bg-transparent disabled:text-white/10 text-white font-bold text-xl py-4 rounded-xl transition-all border border-white/10 hover:border-white/20 uppercase tracking-widest"
        >
          Custom Lobby
        </button>
        {error && <p className="text-red-400 text-center mt-2 font-medium bg-red-400/10 py-2 rounded-lg border border-red-400/20">{error}</p>}
      </div>
    </div>
  );
};

export default Lobby;