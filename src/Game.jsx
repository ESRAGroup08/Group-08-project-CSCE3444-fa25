import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useParams, useOutletContext, Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { ControlPanel } from './components/ControlPanel';
import { RocketDisplay } from './components/RocketDisplay';
import ResultsModal from './components/ResultsModal';
import { motion, AnimatePresence } from 'framer-motion';

// Asteroid Attack Overlay Component
const AsteroidWarning = () => (
    <motion.div
        className="absolute inset-0 bg-red-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 text-white"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.3 }}
    >
        <AlertTriangle className="w-24 h-24 text-red-400 animate-pulse mb-4" />
        <h2 className="text-4xl font-bold text-red-300">ASTEROID IMPACT!</h2>
        <p className="text-xl text-red-200">Your systems are temporarily disrupted!</p>
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
  const [isMatchmaking, setIsMatchmaking] = useState(() => roomId !== 'demo');
  const [matchmakingMessage, setMatchmakingMessage] = useState('');

  useEffect(() => {
    if (socket) {
      setMyPlayerId(socket.id);
    }
  }, [socket]);

  // *** FIX: Define event handlers with useCallback to stabilize them ***
  const handleOpponentProgress = useCallback(({ playerId, progress, wpm, finished }) => {
    setGameState(prev => {
        if (!prev || !prev.players[playerId]) return prev;
        const updatedPlayer = { ...prev.players[playerId], progress, wpm: Math.round(wpm) };
        if (finished) {
            updatedPlayer.finished = true;
        }
        return {
            ...prev,
            players: {
                ...prev.players,
                [playerId]: updatedPlayer
            }
        };
    });
  }, []);

  const handleGameOver = useCallback(({ players }) => {
      setGameState(prev => ({ ...prev, players }));
      setIsGameOver(true);

      const playersWithId = Object.entries(players).map(([id, p]) => ({ ...p, id }));
      const myPlayer = playersWithId.find(p => p.id === socket?.id);
      const finishedPlayers = playersWithId.filter(p => p.finished);

      if (!myPlayer || finishedPlayers.length === 0) {
          setPlayerResult('lost');
          return;
      }
      
      const winner = finishedPlayers.sort((a, b) => (b.wpm || 0) - (a.wpm || 0))[0];

      if (winner && myPlayer.id === winner.id) {
          setPlayerResult('won');
      } else {
          setPlayerResult('lost');
      }
  }, [socket?.id]);

  const handlePerkGranted = useCallback(({ perk }) => {
      setHeldPerk(perk);
  }, []);

  const handlePerkUsed = useCallback(() => {
      setHeldPerk(null);
  }, []);

  const handleAsteroidHit = useCallback(() => {
      setIsHitByAsteroid(true);
      setTimeout(() => setIsHitByAsteroid(false), 3000);
  }, []);

  const handleRocketFuel = useCallback(({ autoCompletedText }) => {
      setInputValue(prev => prev + autoCompletedText);
  }, []);

  const handleSuddenDeath = useCallback(({ duration }) => {
      setSuddenDeathTime(duration);
  }, []);


  // Main game setup effect for socket listeners
  useEffect(() => {
    if (!socket || !roomId || roomId === 'demo') return;

    // We are now using the stable useCallback functions
    socket.on('opponent_progress', handleOpponentProgress);
    socket.on('game_over', handleGameOver);
    socket.on('perk_granted', handlePerkGranted);
    socket.on('perk_used', handlePerkUsed);
    socket.on('asteroid_hit', handleAsteroidHit);
    socket.on('perk_effect_rocket_fuel', handleRocketFuel);
    socket.on('suddenDeath', handleSuddenDeath);

    return () => {
      socket.off('opponent_progress', handleOpponentProgress);
      socket.off('game_over', handleGameOver);
      socket.off('perk_granted', handlePerkGranted);
      socket.off('perk_used', handlePerkUsed);
      socket.off('asteroid_hit', handleAsteroidHit);
      socket.off('perk_effect_rocket_fuel', handleRocketFuel);
      socket.off('suddenDeath', handleSuddenDeath);
    };
    // The dependency array is now much smaller and more stable.
  }, [socket, roomId, handleOpponentProgress, handleGameOver, handlePerkGranted, handlePerkUsed, handleAsteroidHit, handleRocketFuel, handleSuddenDeath]);
  
  // This matchmaking logic is just for show, so it can be simplified.
  useEffect(() => {
    if (roomId === 'demo' || !isMatchmaking) return;

    setMatchmakingMessage('Searching for opponents...');
    const timer1 = setTimeout(() => setMatchmakingMessage('Match Found: Zorgon the Swift'), 2000);
    const timer2 = setTimeout(() => setMatchmakingMessage('3'), 3500);
    const timer3 = setTimeout(() => setMatchmakingMessage('2'), 4500);
    const timer4 = setTimeout(() => setMatchmakingMessage('1'), 5500);
    const timer5 = setTimeout(() => {
        setMatchmakingMessage('Launch!');
        setStartTime(Date.now());
        setTimeout(() => setIsMatchmaking(false), 500);
    }, 6500);

    return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
        clearTimeout(timer5);
    };
  }, [roomId, isMatchmaking]);


  useEffect(() => {
    if (suddenDeathTime && suddenDeathTime > 0) {
      const interval = setInterval(() => {
        setSuddenDeathTime(prevTime => (prevTime > 0 ? prevTime - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    } else if (suddenDeathTime === 0) {
      setSuddenDeathTime(null);
    }
  }, [suddenDeathTime]);


  const sendProgress = useCallback(() => {
    if (isGameOver || !gameState || !gameState.text || !socket || !myPlayerId) return;
    if (gameState.players[myPlayerId] && gameState.players[myPlayerId].finished) return;

    const progress = ((inputValue.length / gameState.text.length) * 100);
    const elapsedSeconds = startTime ? (Date.now() - startTime) / 1000 : 0;
    const wpm = elapsedSeconds > 0 ? (inputValue.length / 5) / (elapsedSeconds / 60) : 0;

    setGameState(prev => {
        if (!prev) return prev;
        return { ...prev, players: { ...prev.players, [myPlayerId]: { ...prev.players[myPlayerId], progress, wpm: Math.round(wpm) } } };
    });
    
    socket.emit('player_progress', { roomId, progress, wpm });

    if (inputValue.length === gameState.text.length) {
        const accuracy = Math.round(
            (gameState.text.split('').filter((char, i) => char === inputValue[i]).length / gameState.text.length) * 100
        );
        socket.emit('player_finished', { roomId, wpm: Math.round(wpm), accuracy });
    }
  }, [inputValue, gameState, startTime, isGameOver, socket, roomId, myPlayerId]);

  useEffect(() => {
    sendProgress();
  }, [inputValue, sendProgress]);
  
  const handleUsePerk = useCallback((perkName) => {
    if (!socket || !heldPerk || perkName !== heldPerk) return;
    socket.emit('use_perk', { roomId, perk: perkName });
  }, [socket, heldPerk, roomId]);

  useEffect(() => {
      const handleKeyPress = (e) => {
          if (e.key === '`') {
              e.preventDefault();
              if (heldPerk) handleUsePerk(heldPerk);
          }
      };
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
  }, [heldPerk, handleUsePerk]);

  const myPlayer = gameState && myPlayerId ? gameState.players[myPlayerId] : null;

  const handleInputChange = (e) => {
    if (isGameOver || !gameState || !gameState.text || isHitByAsteroid || (myPlayer && myPlayer.finished)) return;
    const typedValue = e.target.value;
    if (typedValue.length > inputValue.length) {
        const nextChar = typedValue.slice(-1);
        if (gameState.text[inputValue.length] === nextChar) setInputValue(typedValue);
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

  const progress = gameState.text ? (inputValue.length / gameState.text.length) * 100 : 0;

  return (
    <div className="w-full min-h-screen bg-gray-900 flex flex-col relative w-full max-w-[95%] mx-auto py-8">
      {isMatchmaking && (
        <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center text-white">
          <div className="text-4xl font-bold animate-pulse">{matchmakingMessage}</div>
        </div>
      )}
      <AnimatePresence>{isHitByAsteroid && <AsteroidWarning />}</AnimatePresence>
      
      {(myPlayer?.finished || isGameOver) && <ResultsModal players={gameState.players} myPlayerId={myPlayerId} playerResult={playerResult} isGameOver={isGameOver} suddenDeathTime={suddenDeathTime} />}
      
      {suddenDeathTime && !isGameOver && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 bg-red-600/90 backdrop-blur-sm border-2 border-red-400 rounded-lg p-6 text-white shadow-lg">
              <h3 className="text-3xl font-bold text-center mb-2">SUDDEN DEATH</h3>
              {myPlayer && myPlayer.finished ? (
                <p className="text-xl text-center font-bold text-yellow-300">Waiting for others...</p>
              ) : (
                <p className="text-xl text-center">Game ends in <span className="font-bold text-yellow-300">{suddenDeathTime}</span> seconds!</p>
              )}
          </div>
      )}
      
      <main className="flex-1 flex flex-col justify-center">
        <RocketDisplay players={gameState.players} />
        <ControlPanel 
          targetText={gameState.text}
          inputValue={inputValue}
          onInputChange={handleInputChange}
          progress={progress}
          heldPerk={heldPerk}
          onUsePerk={handleUsePerk}
          disabled={isMatchmaking}
        />
      </main>
    </div>
  );
};

export default Game;