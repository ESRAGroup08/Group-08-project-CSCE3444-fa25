import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router-dom';
import { Clipboard, Check, Crown, Gamepad2, ArrowLeft } from 'lucide-react';

const CustomLobby = () => {
  const { socket } = useOutletContext();
  const navigate = useNavigate();
  // We'll get the username from localStorage, which our login bypass sets.
  const [username] = useState(localStorage.getItem('username') || 'Guest');

  const [lobbyState, setLobbyState] = useState(null);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!socket) return;

    // This single event will keep the lobby UI in sync for all players.
    const handleLobbyUpdate = (data) => {
      setError(''); 
      // data might be { roomId, ...roomState } or just roomState. 
      // We ensure roomId persists if already set, or comes from data.
      setLobbyState(prev => ({
          ...prev,
          ...data,
          roomId: data.roomId || prev?.roomId
      }));
    };

    const handleLobbyCreated = ({ roomId, roomState }) => {
        setError('');
        setLobbyState({ ...roomState, roomId });
    };

    const handleError = (data) => {
      setError(data.message);
    };

    // This event tells the client to navigate to the game screen.
    const handleGameStarting = (gameData) => {
      navigate(`/game/${gameData.roomId}`, { state: { ...gameData } });
    };

    // Listen for events from the server
    socket.on('lobby_state_update', handleLobbyUpdate);
    socket.on('private_lobby_created', handleLobbyCreated); // NEW Listener
    socket.on('lobby_error', handleError);
    socket.on('match_found', handleGameStarting); // Changed from game_starting to match_found

    // Clean up listeners when the component is unmounted
    return () => {
      socket.off('lobby_state_update', handleLobbyUpdate);
      socket.off('private_lobby_created', handleLobbyCreated);
      socket.off('lobby_error', handleError);
      socket.off('match_found', handleGameStarting);
    };
  }, [socket, navigate]);

  // --- Functions to emit events to the server ---
  const handleCreateLobby = () => {
    socket.emit('create_private_lobby', { username }); // Fixed Event Name
  };

  const handleJoinLobby = (e) => {
    e.preventDefault();
    if (!joinRoomId.trim()) return;
    socket.emit('join_private_lobby', { username, roomId: joinRoomId.trim() }); // Fixed Event Name
  };

  const handleSetReady = () => {
    const me = lobbyState.players.find(p => p.username === username);
    if (!me) return;
    socket.emit('set_private_ready', { roomId: lobbyState.roomId, username, isReady: !me.isReady }); // Fixed Event Name
  };
  
  const handleStartGame = () => {
      socket.emit('start_private_game', { roomId: lobbyState.roomId, username }); // Fixed Event Name
  };

  const copyToClipboard = () => {
    if (!lobbyState?.roomId) return;
    navigator.clipboard.writeText(lobbyState.roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset icon after 2 seconds
  };

  // --- RENDER LOGIC ---

  // RENDER 1: Screen for creating or joining a lobby
  if (!lobbyState) {
    return (
      <div className="w-full h-screen bg-transparent text-white flex flex-col items-center justify-center p-4">
        <div className="absolute top-8 left-8">
            <Link to="/menu" className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors group">
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                Back to Menu
            </Link>
        </div>
        <h1 className="text-6xl font-black mb-12 tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-500 uppercase">Custom Lobby</h1>
        <div className="w-full max-w-md bg-black/40 backdrop-blur-xl p-10 rounded-3xl border border-white/10 shadow-2xl">
          <button
            onClick={handleCreateLobby}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-2xl py-5 rounded-xl transition-all shadow-lg hover:shadow-cyan-500/40 hover:-translate-y-1 uppercase tracking-wider"
          >
            Create Lobby
          </button>
          <div className="relative flex py-8 items-center">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-4 text-white/20 font-black text-xs tracking-widest">OR JOIN EXISTING</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>
          <form onSubmit={handleJoinLobby} className="space-y-4">
            <input
              type="text"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value)}
              placeholder="ENTER LOBBY ID"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 font-bold tracking-widest text-center"
            />
            {error && <p className="text-red-400 text-sm font-bold bg-red-400/10 p-3 rounded-lg border border-red-400/20 text-center">{error}</p>}
            <button
              type="submit"
              className="w-full bg-white/10 hover:bg-white/20 text-white font-bold text-xl py-4 rounded-xl transition-all border border-white/10 hover:border-white/20 uppercase tracking-widest mt-2"
            >
              Join Lobby
            </button>
          </form>
        </div>
      </div>
    );
  }

  // RENDER 2: The interactive lobby screen after creating/joining
  const me = lobbyState.players.find(p => p.username === username);
  const isHost = lobbyState.host === username;
  const allReady = lobbyState.players.length > 1 && lobbyState.players.every(p => p.isReady);

  return (
    <div className="w-full h-screen bg-transparent text-white flex flex-col items-center justify-center p-4">
      <div className="bg-black/40 backdrop-blur-xl p-10 rounded-3xl border border-white/10 shadow-2xl w-full max-w-xl">
        <div className="text-center mb-10">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white/40 mb-4">Transmission ID</h2>
            <div className="flex items-center justify-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 group">
                <p className="text-3xl font-mono font-black text-cyan-300 tracking-widest">{lobbyState.roomId}</p>
                <button onClick={copyToClipboard} className="text-white/40 hover:text-white transition-all">
                {copied ? <Check size={24} className="text-emerald-400" /> : <Clipboard size={24} />}
                </button>
            </div>
        </div>

        <div className="space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-white/40 ml-1">Crew Members ({lobbyState.players.length})</h3>
            <ul className="space-y-3">
            {lobbyState.players.map(player => (
                <li key={player.username} className={`flex justify-between items-center px-6 py-4 rounded-2xl border transition-all duration-300 ${player.isReady ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-white/5 border-white/5 opacity-60'}`}>
                <span className="flex items-center gap-3 font-bold text-lg">
                    {player.username === lobbyState.host && <Crown size={18} className="text-yellow-400" />}
                    {player.username}
                </span>
                <span className={`text-xs font-black uppercase tracking-widest ${player.isReady ? 'text-emerald-400' : 'text-white/20'}`}>
                    {player.isReady ? 'Ready' : 'Waiting'}
                </span>
                </li>
            ))}
            </ul>
        </div>
        
        {error && <p className="text-red-400 text-sm font-bold bg-red-400/10 p-3 rounded-lg border border-red-400/20 text-center mt-6">{error}</p>}

        <div className="mt-10 flex gap-4">
            {me && !isHost && (
            <button
                onClick={handleSetReady}
                className={`w-full font-black text-xl py-5 rounded-2xl transition-all uppercase tracking-widest shadow-lg ${me.isReady ? 'bg-amber-600 hover:bg-amber-500 hover:shadow-amber-500/20' : 'bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-500/20'}`}
            >
                {me.isReady ? 'Stand Down' : 'Ready Up'}
            </button>
            )}
            {isHost && (
            <button
                onClick={handleStartGame}
                disabled={!allReady}
                className="w-full font-black text-xl py-5 rounded-2xl transition-all bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-white/5 disabled:to-white/5 disabled:text-white/20 disabled:cursor-not-allowed flex items-center justify-center gap-3 uppercase tracking-widest shadow-xl hover:shadow-purple-500/20 hover:-translate-y-1"
            >
                <Gamepad2 size={24} />
                Engage
            </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default CustomLobby;