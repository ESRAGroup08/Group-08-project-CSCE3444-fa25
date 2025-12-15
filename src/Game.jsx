import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useParams, useOutletContext, Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Waves, CloudDrizzle, Zap } from 'lucide-react';
import { ControlPanel } from './components/ControlPanel';
import { RocketDisplay } from './components/RocketDisplay';
import ResultsModal from './components/ResultsModal';
import { motion, AnimatePresence } from 'framer-motion';

// MERGED: Added all new perk UI components from remote
const PerkWarning = ({ icon, title, text, bgColor }) => (
    <motion.div
        className={`absolute inset-0 ${bgColor} backdrop-blur-sm flex flex-col items-center justify-center z-50 text-white`}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.3 }}
    >
        {icon}
        <h2 className="text-4xl font-bold">{title}</h2>
        <p className="text-xl">{text}</p>
    </motion.div>
);

const Game = () => {
  const { socket } = useOutletContext();
  const { roomId } = useParams();
  const location = useLocation();

  const [gameState, setGameState] = useState(location.state || null);
  const [inputValue, setInputValue] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [heldPerk, setHeldPerk] = useState(null);
  const [isHitByAsteroid, setIsHitByAsteroid] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState(null);
  const [playerResult, setPlayerResult] = useState(null);
  const [suddenDeathTime, setSuddenDeathTime] = useState(null);
  
  // MERGED: New state for remote features
  const [isMatchmaking, setIsMatchmaking] = useState(() => roomId !== 'demo');
  const [matchmakingMessage, setMatchmakingMessage] = useState('Searching for opponents...');
  const [isHitByRepulsor, setIsHitByRepulsor] = useState(false);
  const [isHitByNebula, setIsHitByNebula] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (socket) setMyPlayerId(socket.id);
  }, [socket]);
  
  // MERGED: All our useCallback fixes are preserved, and new perk handlers are added
  const handleOpponentProgress = useCallback(({ playerId, progress, wpm, finished }) => {
    setGameState(prev => {
        if (!prev?.players?.[playerId]) return prev;
        const updatedPlayer = { ...prev.players[playerId], progress, wpm: Math.round(wpm), finished: !!finished };
        return { ...prev, players: { ...prev.players, [playerId]: updatedPlayer } };
    });
  }, []);

  const handleGameOver = useCallback(({ players }) => {
      setGameState(prev => ({ ...prev, players }));
      setIsGameOver(true);
      const playersWithId = Object.entries(players).map(([id, p]) => ({ ...p, id }));
      const myPlayer = playersWithId.find(p => p.id === socket?.id);
      const winner = playersWithId.filter(p => p.finished).sort((a, b) => (b.wpm || 0) - (a.wpm || 0))[0];
      setPlayerResult(winner && myPlayer && winner.id === myPlayer.id ? 'won' : 'lost');
  }, [socket?.id]);

  const handlePerkGranted = useCallback(({ perk }) => setHeldPerk(perk), []);
  const handlePerkUsed = useCallback(() => setHeldPerk(null), []);
  const handleAsteroidHit = useCallback(() => { setIsHitByAsteroid(true); setTimeout(() => setIsHitByAsteroid(false), 3000); }, []);
  const handleRocketFuel = useCallback(({ autoCompletedText }) => setInputValue(prev => prev + autoCompletedText), []);
  const handleSuddenDeath = useCallback((data) => setSuddenDeathTime(data?.duration), []);
  const handleRepulsorHit = useCallback(() => { setIsHitByRepulsor(true); setTimeout(() => { setIsHitByRepulsor(false); setInputValue(val => val.slice(0, -10)); }, 100); }, []);
  const handleNebulaHit = useCallback(() => { setIsHitByNebula(true); setTimeout(() => setIsHitByNebula(false), 4000); }, []);

  useEffect(() => {
    if (!socket || !roomId || roomId === 'demo') return;
    const listeners = { 'opponent_progress': handleOpponentProgress, 'game_over': handleGameOver, 'perk_granted': handlePerkGranted, 'perk_used': handlePerkUsed, 'asteroid_hit': handleAsteroidHit, 'perk_effect_rocket_fuel': handleRocketFuel, 'suddenDeath': handleSuddenDeath, 'repulsor_hit': handleRepulsorHit, 'nebula_hit': handleNebulaHit };
    Object.entries(listeners).forEach(([event, handler]) => socket.on(event, handler));
    return () => Object.entries(listeners).forEach(([event, handler]) => socket.off(event, handler));
  }, [socket, roomId, handleOpponentProgress, handleGameOver, handlePerkGranted, handlePerkUsed, handleAsteroidHit, handleRocketFuel, handleSuddenDeath, handleRepulsorHit, handleNebulaHit]);
  
  useEffect(() => {
    if (roomId === 'demo' || !isMatchmaking) {
        if (inputRef.current) inputRef.current.focus();
        return;
    };
    const timers = [
        setTimeout(() => setMatchmakingMessage('Match Found...'), 2000),
        setTimeout(() => setMatchmakingMessage('3'), 3500),
        setTimeout(() => setMatchmakingMessage('2'), 4500),
        setTimeout(() => setMatchmakingMessage('1'), 5500),
        setTimeout(() => {
            setMatchmakingMessage('Launch!');
            setStartTime(Date.now());
            setTimeout(() => {
                setIsMatchmaking(false);
                if (inputRef.current) inputRef.current.focus();
            }, 500);
        }, 6500)
    ];
    return () => timers.forEach(clearTimeout);
  }, [roomId, isMatchmaking]);

  const sendProgress = useCallback(() => {
    if (isGameOver || !gameState?.text || !socket || !myPlayerId || gameState.players[myPlayerId]?.finished) return;
    const progress = (inputValue.length / gameState.text.length) * 100;
    const elapsedSeconds = startTime ? (Date.now() - startTime) / 1000 : 0;
    const wpm = elapsedSeconds > 0 ? (inputValue.length / 5) / (elapsedSeconds / 60) : 0;
    setGameState(prev => ({ ...prev, players: { ...prev.players, [myPlayerId]: { ...prev.players[myPlayerId], progress, wpm: Math.round(wpm) } } }));
    socket.emit('player_progress', { roomId, progress, wpm });
    if (inputValue.length === gameState.text.length) {
        const accuracy = Math.round((gameState.text.split('').filter((char, i) => char === inputValue[i]).length / gameState.text.length) * 100);
        socket.emit('player_finished', { roomId, wpm: Math.round(wpm), accuracy });
    }
  }, [inputValue, gameState, startTime, isGameOver, socket, roomId, myPlayerId]);

  useEffect(() => { sendProgress(); }, [inputValue, sendProgress]);
  
  const handleUsePerk = useCallback((perkName) => {
    if (socket && heldPerk && perkName === heldPerk) socket.emit('use_perk', { roomId, perk: perkName });
  }, [socket, heldPerk, roomId]);

  useEffect(() => {
      const handleKeyPress = (e) => { if (e.key === '`') { e.preventDefault(); if (heldPerk) handleUsePerk(heldPerk); } };
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
  }, [heldPerk, handleUsePerk]);

  const handleInputChange = (e) => {
    const myPlayer = gameState?.players[myPlayerId];
    if (isGameOver || !gameState?.text || isHitByAsteroid || isHitByNebula || myPlayer?.finished) return;
    const typedValue = e.target.value;
    if (typedValue.length > inputValue.length) {
        if (gameState.text[inputValue.length] === typedValue.slice(-1)) setInputValue(typedValue);
    } else {
        setInputValue(typedValue);
    }
  };

  if (!gameState) {
    return (
      <div className="w-full h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
        {roomId !== 'demo' ? (
             <>
                <h2 className="text-3xl font-bold text-red-500 mb-4">Game not found or has ended.</h2>
                <Link to="/lobby" className="flex items-center gap-2 text-cyan-400 hover:text-white transition-colors">
                <ArrowLeft size={20} /> Back to Lobby
                </Link>
             </>
        ) : (
             <div className="text-2xl">Loading Demo...</div>
        )}
      </div>
    );
  }
  
  return (
    <div className="w-full min-h-screen bg-gray-900 flex flex-col relative w-full max-w-[95%] mx-auto py-8">
      {isMatchmaking && ( <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center text-white">
          <div className="text-4xl font-bold animate-pulse">{matchmakingMessage}</div>
        </div> )}
      <AnimatePresence>
        {isHitByAsteroid && <PerkWarning icon={<AlertTriangle className="w-24 h-24 text-red-400 animate-pulse mb-4" />} title="ASTEROID IMPACT!" text="Systems disrupted!" bgColor="bg-red-900/80" />}
        {isHitByRepulsor && <PerkWarning icon={<Waves className="w-24 h-24 text-blue-400 animate-ping mb-4" />} title="REPULSOR WAVE!" text="Pushed back!" bgColor="bg-blue-900/80" />}
        {isHitByNebula && <PerkWarning icon={<CloudDrizzle className="w-24 h-24 text-purple-400 mb-4" />} title="NEBULA CLOUD!" text="Vision obscured!" bgColor="bg-purple-900/80" />}
      </AnimatePresence>
      {(gameState.players[myPlayerId]?.finished || isGameOver) && <ResultsModal players={gameState.players} myPlayerId={myPlayerId} playerResult={playerResult} isGameOver={isGameOver} suddenDeathTime={suddenDeathTime} />}
      {suddenDeathTime && !isGameOver && ( <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 bg-red-600/90 backdrop-blur-sm border-2 border-red-400 rounded-lg p-6 text-white shadow-lg">
              <h3 className="text-3xl font-bold text-center mb-2">SUDDEN DEATH</h3>
              {myPlayer && myPlayer.finished ? (
                <p className="text-xl text-center font-bold text-yellow-300">Waiting for others...</p>
              ) : (
                <p className="text-xl text-center">Game ends in <span className="font-bold text-yellow-300">{suddenDeathTime}</span> seconds!</p>
              )}
          </div> )}
      <main className="flex-1 flex flex-col justify-center">
        <RocketDisplay players={gameState.players} />
        <ControlPanel ref={inputRef} targetText={gameState.text} inputValue={inputValue} onInputChange={handleInputChange} progress={(inputValue.length / gameState.text.length) * 100} heldPerk={heldPerk} onUsePerk={handleUsePerk} disabled={isMatchmaking || isHitByNebula} />
      </main>
    </div>
  );
};

export default Game;