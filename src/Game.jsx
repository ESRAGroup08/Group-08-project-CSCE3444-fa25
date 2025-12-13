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

  // Initialize state from router state if available
  const [gameState, setGameState] = useState(location.state || null);
  const [inputValue, setInputValue] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [isGameOver, setIsGameOver] = useState(false);

  // New state for perks
  const [heldPerk, setHeldPerk] = useState(null);
  const [isHitByAsteroid, setIsHitByAsteroid] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState(null);
  const [playerResult, setPlayerResult] = useState(null); // 'won' or 'lost'
  const [suddenDeathTime, setSuddenDeathTime] = useState(null);
  const [isMatchmaking, setIsMatchmaking] = useState(true);
  const [matchmakingMessage, setMatchmakingMessage] = useState('');

  useEffect(() => {
    if (roomId === 'demo') {
      setIsMatchmaking(false);
      return;
    }

    const performMatchmaking = async () => {
      console.log('Searching for opponents...');
      setMatchmakingMessage('Searching for opponents...');
      await new Promise(resolve => setTimeout(resolve, 15000));

      console.log('Match Found: Zorgon the Swift');
      setMatchmakingMessage('Match Found: Zorgon the Swift');
      await new Promise(resolve => setTimeout(resolve, 2000));

      for (let i = 3; i > 0; i--) {
        console.log(i);
        setMatchmakingMessage(String(i));
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log('Launch!');
      setMatchmakingMessage('Launch!');
      await new Promise(resolve => setTimeout(resolve, 500));

      setStartTime(Date.now()); // Set global start time
      setIsMatchmaking(false);
    };

    performMatchmaking();
  }, [roomId]);

  useEffect(() => {
    if (socket) {
        setMyPlayerId(socket.id);
    }
  }, [socket]);
  
  const handleUsePerk = useCallback((perkName) => {
    if (!socket || !heldPerk || perkName !== heldPerk) return;
    socket.emit('use_perk', { roomId, perk: perkName });
  }, [socket, heldPerk, roomId]);

  // Main game loop and socket event handler
  useEffect(() => {
    if (!socket || !roomId || roomId === 'demo') return;

    const handleOpponentProgress = ({ playerId, progress, wpm, finished }) => {
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
    };
    
    const handleGameOver = ({ players }) => {
        setGameState(prev => ({ ...prev, players }));
        setIsGameOver(true);
        // 1. Convert players object to array with IDs
        const playersWithId = Object.entries(players).map(([id, p]) => ({ ...p, id }));
        // 2. Find myself
        const myPlayer = playersWithId.find(p => p.id === myPlayerId);
        // 3. Find winner
        const finishedPlayers = playersWithId.filter(p => p.finished);
        // Check if player exists and game is valid
        if (myPlayer === undefined || finishedPlayers.length === 0) {
            setPlayerResult('lost');
            return;
        }
        // Sort descending by WPM
        const winner = finishedPlayers.sort((a, b) => (b.wpm || 0) - (a.wpm || 0))[0];
        // 4. Compare IDs safely
        if (winner && myPlayer.id === winner.id) {
            setPlayerResult('won');
        } else {
            setPlayerResult('lost');
        }
    };

    const handlePerkGranted = ({ perk }) => {
        setHeldPerk(perk);
    };

    const handlePerkUsed = () => {
        setHeldPerk(null);
    };

    const handleAsteroidHit = () => {
        setIsHitByAsteroid(true);
        setTimeout(() => setIsHitByAsteroid(false), 3000); // 3-second disruption
    };

    const handleRocketFuel = ({ autoCompletedText }) => {
        setInputValue(prev => prev + autoCompletedText);
    };

    const handleSuddenDeath = ({ duration }) => {
        if (isGameOver) return;
        console.log(`Sudden Death! ${duration} seconds remaining`);
        setSuddenDeathTime(duration);
    };

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

  }, [socket, roomId, myPlayerId, isGameOver]);

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


  // This function is stable and won't cause re-renders
  const sendProgress = useCallback(() => {
    if (isGameOver || !gameState || !gameState.text || !socket || !myPlayerId) return;

    // Freeze stats once the player has finished
    if (gameState.players[myPlayerId] && gameState.players[myPlayerId].finished) {
      return;
    }

    const progress = ((inputValue.length / gameState.text.length) * 100);
    const elapsedSeconds = startTime ? (Date.now() - startTime) / 1000 : 0;
    const wpm = elapsedSeconds > 0 ? (inputValue.length / 5) / (elapsedSeconds / 60) : 0;

    // Update local visual state immediately for responsiveness
    setGameState(prev => {
        if (!prev) return prev;
        return {
            ...prev,
            players: {
              ...prev.players,
              [myPlayerId]: { ...prev.players[myPlayerId], progress, wpm: Math.round(wpm) }
            }
        }
    });
    
    // Send update to server
    socket.emit('player_progress', { roomId, progress, wpm });

    // Check for finish
    if (inputValue.length === gameState.text.length) {
        const accuracy = Math.round(
            (gameState.text.split('').filter((char, i) => char === inputValue[i]).length / gameState.text.length) * 100
        );
        socket.emit('player_finished', { roomId, wpm: Math.round(wpm), accuracy });
    }
  }, [inputValue, gameState, startTime, isGameOver, socket, roomId, myPlayerId]);

  // Effect to send progress whenever input value changes
  useEffect(() => {
    sendProgress();
  }, [inputValue, sendProgress]);

  // NEW: Effect for handling perk activation with backtick key
  useEffect(() => {
      const handleKeyPress = (e) => {
          if (e.key === '`') {
              e.preventDefault(); // Prevents typing the character in the input
              if (heldPerk) {
                  handleUsePerk(heldPerk);
              }
          }
      };
      
      window.addEventListener('keydown', handleKeyPress);
      
      return () => {
          window.removeEventListener('keydown', handleKeyPress);
      };
  }, [heldPerk, handleUsePerk]);


  const myPlayer = gameState && myPlayerId ? gameState.players[myPlayerId] : null;

  const handleInputChange = (e) => {
    if (isGameOver || !gameState || !gameState.text || isHitByAsteroid || (myPlayer && myPlayer.finished)) return;

    const typedValue = e.target.value;

    // Strict Typing: only allow correct characters to be added
    if (typedValue.length > inputValue.length) {
        const nextChar = typedValue.slice(-1);
        if (gameState.text[inputValue.length] === nextChar) {
            setInputValue(typedValue);
        }
    } else {
        // Allow deletion
        setInputValue(typedValue);
    }
  };

  // Loading/Error states
  if (!gameState) {
    return (
      <div className="w-full h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
        {roomId !== 'demo' ? (
             <>
                <h2 className="text-3xl font-bold text-red-500 mb-4">Error: Game room not found or invalid.</h2>
                <Link to="/menu" className="flex items-center gap-2 text-cyan-400 hover:text-white transition-colors">
                <ArrowLeft size={20} /> Return to Menu
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
      <AnimatePresence>
        {isHitByAsteroid && <AsteroidWarning />}
      </AnimatePresence>
      
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
          disabled={isMatchmaking} // Disable input during matchmaking
        />
      </main>
    </div>
  );
};

export default Game;