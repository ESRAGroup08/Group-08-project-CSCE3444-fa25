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
      <div className="w-full h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
        <div className="absolute top-8 left-8">
            <Link to="/menu" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                <ArrowLeft size={20} />
                Back to Menu
            </Link>
        </div>
        <h1 className="text-5xl font-bold mb-12">Custom Lobby</h1>
        <div className="w-full max-w-md bg-gray-800/50 p-8 rounded-lg border border-cyan-500/30">
          <button
            onClick={handleCreateLobby}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xl py-3 rounded-lg mb-6 transition-all"
          >
            Create New Lobby
          </button>
          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-gray-600"></div>
            <span className="flex-shrink mx-4 text-gray-400">OR</span>
            <div className="flex-grow border-t border-gray-600"></div>
          </div>
          <form onSubmit={handleJoinLobby}>
            <input
              type="text"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value)}
              placeholder="Enter Lobby ID"
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
            <button
              type="submit"
              className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xl py-3 rounded-lg mt-4 transition-all"
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
    <div className="w-full h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <h2 className="text-4xl font-bold mb-4">Lobby ID</h2>
      <div className="flex items-center gap-4 bg-gray-800 p-3 rounded-lg border border-cyan-500/30 mb-8">
        <p className="text-2xl font-mono text-cyan-300">{lobbyState.roomId}</p>
        <button onClick={copyToClipboard} className="hover:text-cyan-300 transition-all">
          {copied ? <Check size={24} className="text-green-400" /> : <Clipboard size={24} />}
        </button>
      </div>

      <div className="w-full max-w-lg bg-gray-800/50 p-6 rounded-lg">
        <h3 className="text-2xl font-bold mb-4">Players ({lobbyState.players.length})</h3>
        <ul className="space-y-3">
          {lobbyState.players.map(player => (
            <li key={player.username} className={`flex justify-between items-center p-3 rounded-lg transition-all ${player.isReady ? 'bg-green-600/30' : 'bg-gray-700/50'}`}>
              <span className="flex items-center gap-2">
                {player.username === lobbyState.host && <Crown size={20} className="text-yellow-400" />}
                {player.username}
              </span>
              <span className={`font-bold ${player.isReady ? 'text-green-300' : 'text-gray-400'}`}>
                {player.isReady ? 'Ready' : 'Not Ready'}
              </span>
            </li>
          ))}
        </ul>
      </div>
      
      {error && <p className="text-red-500 text-center mt-4">{error}</p>}

      <div className="w-full max-w-lg mt-6 flex gap-4">
        {me && !isHost && (
          <button
            onClick={handleSetReady}
            className={`w-full font-bold text-xl py-3 rounded-lg transition-all ${me.isReady ? 'bg-yellow-500 hover:bg-yellow-400' : 'bg-green-500 hover:bg-green-400'}`}
          >
            {me.isReady ? 'Unready' : 'Ready Up'}
          </button>
        )}
        {isHost && (
          <button
            onClick={handleStartGame}
            disabled={!allReady}
            className="w-full font-bold text-xl py-3 rounded-lg transition-all bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Gamepad2 />
            Start Game
          </button>
        )}
      </div>
    </div>
  );
};

export default CustomLobby;