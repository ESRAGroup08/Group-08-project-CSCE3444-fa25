import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import './MainMenu.css'; // Assuming this has your menu-button styles

const CustomLobby = () => {
  const navigate = useNavigate();
  // Get both `socket` and `user` from the context provided by App.jsx
  const { socket, user } = useOutletContext(); 
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState('');

  // The current user's username is now reliably passed via context
  const currentUser = user?.username;

  // This effect handles all incoming socket events for the lobby
  useEffect(() => {
    if (!socket) return;
    
    const handleLobbyState = (data) => {
      console.log('CLIENT: Received lobby state:', data);
      setError(''); // Clear errors on a successful state update
      setRoomCode(data.roomId);
      setPlayers(data.players);
      
      // Use the reliable `currentUser` variable from context
      if (currentUser) {
        const self = data.players.find(p => p.username === currentUser);
        if (self) {
          setIsHost(data.host === self.username);
        }
      }
    };

    const handleError = (data) => {
      console.error('CLIENT: Lobby Error:', data.message);
      setError(data.message);
    };

    socket.on('lobby:state', handleLobbyState);
    socket.on('error', handleError);

    // Cleanup listeners when the component unmounts
    return () => {
      socket.off('lobby:state', handleLobbyState);
      socket.off('error', handleError);
    };
  }, [socket, currentUser]); // Add currentUser to dependency array

  const handleCreateRoom = () => {
    socket.emit('lobby:create');
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (joinCode.trim()) {
      socket.emit('lobby:join', { roomId: joinCode.trim() });
    }
  };

  const handleReadyClick = () => {
    const newReadyState = !isReady;
    setIsReady(newReadyState);
    socket.emit('lobby:setReady', { roomId: roomCode, ready: newReadyState });
  };
    
  const handleLeaveLobby = () => {
    if (roomCode) {
      socket.emit('lobby:leave', { roomId: roomCode });
    }
    // Reset all local state
    setRoomCode('');
    setPlayers([]);
    setIsHost(false);
    setIsReady(false);
    setError('');
  };

  // --- RENDER LOGIC ---

  // View 1: Initial screen ("Create" or "Join")
  if (!roomCode) {
    return (
      <div className="main-menu-container">
        <h2 className="text-3xl font-bold mb-6">Custom Lobby</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="flex flex-col gap-4 items-center">
          <button className="menu-button" onClick={handleCreateRoom}>
            Create Room
          </button>
          
          <form onSubmit={handleJoinRoom} className="w-full max-w-sm flex flex-col items-center">
            <input
              type="text"
              placeholder="Enter Room Code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toLowerCase())}
              className="bg-gray-700 text-white text-center w-full px-4 py-2 rounded-lg mb-2 uppercase"
              style={{fontFamily: 'monospace'}}
            />
            <button type="submit" className="menu-button" disabled={!joinCode.trim()}>
              Join with Code
            </button>
          </form>
        </div>
        <button className="menu-button secondary mt-8" onClick={() => navigate('/lobby')}>
          Back
        </button>
      </div>
    );
  }

  // View 2: Inside the lobby room
  return (
    <div className="main-menu-container">
      <h2 className="text-3xl font-bold">Room Code</h2>
      <p 
        className="text-2xl text-cyan-400 font-mono bg-gray-900 p-2 rounded-md my-4 tracking-widest cursor-pointer"
        onClick={() => navigator.clipboard.writeText(roomCode)}
        title="Click to copy"
      >
        {roomCode}
      </p>
      
      <h3 className="text-2xl font-bold mt-8 mb-4">Players</h3>
      <ul className="w-full max-w-md bg-gray-800 p-4 rounded-lg">
        {players.map((player) => (
          <li key={player.username} className={`flex justify-between items-center p-2 rounded-md ${player.ready ? 'bg-green-800/50' : ''}`}>
            {/* Use the reliable `currentUser` variable here as well */}
            <span>{player.username} {player.username === currentUser ? '(You)' : ''}</span>
            <span className={`font-bold ${player.ready ? 'text-green-400' : 'text-yellow-400'}`}>
              {player.ready ? 'Ready' : 'Not Ready'}
            </span>
          </li>
        ))}
      </ul>
      
      <div className="mt-8 flex flex-col gap-4">
        <button
          className={`menu-button ${isReady ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}`}
          onClick={handleReadyClick}
        >
          {isReady ? 'Set to Not Ready' : 'Ready Up'}
        </button>
        <button className="menu-button secondary" onClick={handleLeaveLobby}>
          Leave Room
        </button>
      </div>
    </div>
  );
};

export default CustomLobby;