import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useOutletContext } from 'react-router-dom';
import { ControlPanel } from './components/ControlPanel';
import { RocketDisplay } from './components/RocketDisplay';
import ResultsModal from './components/ResultsModal';

const Overlay = ({ title, subtext, showTimer, time, bigText }) => (
    <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center text-white">
        <div className={`font-bold ${bigText ? 'text-9xl text-yellow-400 animate-ping' : 'text-4xl'}`}>{title}</div>
        {subtext && <p className="mt-4 text-gray-400">{subtext}</p>}
        {showTimer && <div className="mt-6 text-yellow-400 text-xl">Starting in {time}s</div>}
    </div>
);

const SuddenDeathOverlay = ({ time }) => (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-red-600/90 backdrop-blur-sm border-2 border-red-400 rounded-lg p-4 text-white shadow-lg animate-pulse">
        <h3 className="text-2xl font-bold text-center">SUDDEN DEATH!</h3>
        <p className="text-lg text-center">Ending in <span className="font-bold text-yellow-300">{time}s</span></p>
    </div>
);

const Game = () => {
  const { socket } = useOutletContext();
  const { roomId } = useParams();
  const location = useLocation();
  
  const [gameState, setGameState] = useState(location.state || { status: 'loading', players: {} });
  const [inputValue, setInputValue] = useState('');
  const [myPlayerId, setMyPlayerId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [playerResult, setPlayerResult] = useState(null);

  useEffect(() => {
    if (!socket || !socket.connected || !roomId) return;
    setMyPlayerId(socket.id);
    const username = localStorage.getItem('username') || "Guest";
    socket.emit('join_specific_room', { roomId, username });

    const handleState = (data) => {
        if(!data) return;
        
        // Sync Clocks: Calculate duration based on server's time vs server's deadline
        // Then apply that duration to client's current time.
        const lobbyRemaining = data.lobbyEndTime ? (data.lobbyEndTime - data.serverTime) : null;
        const localLobbyEndTime = lobbyRemaining !== null ? Date.now() + lobbyRemaining : null;

        const suddenRemaining = data.suddenDeathEndTime ? (data.suddenDeathEndTime - data.serverTime) : null;
        const localSuddenDeathEndTime = suddenRemaining !== null ? Date.now() + suddenRemaining : null;

        setGameState(prev => ({
            ...prev,
            text: data.text,
            players: data.players,
            status: data.status,
            lobbyEndTime: localLobbyEndTime,
            suddenDeathEndTime: localSuddenDeathEndTime
        }));
        if (data.status === 'playing' && !startTime) setStartTime(Date.now());
    };

    socket.on('room_state', handleState);
    socket.on('players_update', (players) => setGameState(prev => ({ ...prev, players })));
    socket.on('game_over', ({ winnerId, players }) => {
        setGameState(prev => ({ ...prev, players, status: 'finished' }));
        setIsGameOver(true);
        setPlayerResult(socket.id === winnerId ? 'won' : 'lost');
    });
    socket.on('match_found', handleState);

    return () => {
        socket.off('room_state', handleState);
        socket.off('players_update');
        socket.off('game_over');
        socket.off('match_found');
    };
  }, [socket, roomId]);

  useEffect(() => {
      const targetTime = gameState.status === 'waiting' ? gameState.lobbyEndTime : 
                         (gameState.status === 'countdown' ? gameState.lobbyEndTime : 
                         (gameState.status === 'sudden_death' ? gameState.suddenDeathEndTime : null));
      if (!targetTime) { setTimeLeft(null); return; }
      const interval = setInterval(() => {
          const diff = Math.ceil((targetTime - Date.now()) / 1000);
          setTimeLeft(diff > 0 ? diff : 0);
      }, 100);
      return () => clearInterval(interval);
  }, [gameState.status, gameState.lobbyEndTime, gameState.suddenDeathEndTime]);

  const handleInputChange = (e) => {
      if (gameState.status !== 'playing' && gameState.status !== 'sudden_death') return;
      const val = e.target.value;
      if (!gameState.text || !gameState.text.startsWith(val)) return;
      setInputValue(val);
      const progress = (val.length / gameState.text.length) * 100;
      let wpm = 0;
      if (startTime) {
          const min = (Date.now() - startTime) / 60000;
          if (min > 0) wpm = Math.round((val.length / 5) / min);
      }
      
      // Optimistic update
      if (gameState.players[myPlayerId]) {
          setGameState(prev => ({
              ...prev,
              players: { ...prev.players, [myPlayerId]: { ...prev.players[myPlayerId], progress, wpm } }
          }));
      }

      if (val.length === gameState.text.length) socket.emit('player_finished', { roomId, wpm });
      else socket.emit('player_progress', { roomId, progress, wpm });
  };

  const myPlayer = gameState.players?.[myPlayerId];
  const myProgress = myPlayer?.progress || 0;
  const showResults = isGameOver || myPlayer?.finished;

  return (
    <div className="w-full min-h-screen bg-gray-900 flex flex-col relative w-full max-w-[95%] mx-auto py-8">
        {showResults && <ResultsModal players={gameState.players} myPlayerId={myPlayerId} playerResult={playerResult} isGameOver={isGameOver} />}
        {gameState.status === 'loading' && <Overlay title="Loading..." />}
        {gameState.status === 'waiting' && <Overlay title="Waiting..." subtext={`(${Object.keys(gameState.players || {}).length}/4)`} showTimer={!!gameState.lobbyEndTime} time={timeLeft} />}
        {gameState.status === 'countdown' && <Overlay title={timeLeft} bigText={true} />}
        {gameState.status === 'sudden_death' && !myPlayer?.finished && <SuddenDeathOverlay time={timeLeft} />}
        <div className="flex-1 flex flex-col justify-center">
            <RocketDisplay players={gameState.players} />
            <ControlPanel targetText={gameState.text || ""} inputValue={inputValue} onInputChange={handleInputChange} progress={myProgress} disabled={gameState.status !== 'playing' && gameState.status !== 'sudden_death' || myPlayer?.finished} />
        </div>
    </div>
  );
};

export default Game;