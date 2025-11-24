import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useOutletContext, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { RocketDisplay } from './components/RocketDisplay';
import { ControlPanel } from './components/ControlPanel';
import ResultsModal from './components/ResultsModal';

const Game = () => {
  const { socket } = useOutletContext();
  const { roomId } = useParams();
  const location = useLocation();

  const [gameState, setGameState] = useState(location.state);
  const [inputValue, setInputValue] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [isGameOver, setIsGameOver] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const handleOpponentProgress = (data) => {
      setGameState(prev => {
        if (!prev || !prev.players[data.playerId]) return prev;
        const newPlayers = { ...prev.players };
        newPlayers[data.playerId] = { ...newPlayers[data.playerId], ...data };
        return { ...prev, players: newPlayers };
      });
    };

    const handleGameOver = (data) => {
      setGameState(prev => ({ ...prev, players: data.players }));
      setIsGameOver(true);
    };

    socket.on('opponent_progress', handleOpponentProgress);
    socket.on('game_over', handleGameOver);

    return () => {
      socket.off('opponent_progress', handleOpponentProgress);
      socket.off('game_over', handleGameOver);
    };
  }, [socket]);

  if (!gameState || !gameState.text) {
    return (
      <div className="w-full h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
        <h2 className="text-3xl font-bold text-red-500 mb-4">Error: Game room not found or invalid.</h2>
        <Link to="/menu" className="flex items-center gap-2 text-cyan-400 hover:text-white transition-colors">
          <ArrowLeft size={20} /> Return to Menu
        </Link>
      </div>
    );
  }
  
  const handleInputChange = (e) => {
    if (isGameOver) return;

    const value = e.target.value;
    if (!startTime) setStartTime(Date.now());
    
    // Don't allow typing more characters than the target text
    if (value.length > gameState.text.length) return;

    setInputValue(value);

    const progress = (value.length / gameState.text.length) * 100;
    const elapsedSeconds = (Date.now() - startTime) / 1000;
    const wpm = elapsedSeconds > 0 ? (value.length / 5) / (elapsedSeconds / 60) : 0;
    
    socket.emit('player_progress', { roomId, progress, wpm: Math.round(wpm) });

    // --- THIS IS THE FIX ---
    // The game ends when the typed length matches the target length.
    if (value.length === gameState.text.length) {
      const accuracy = calculateAccuracy(value, gameState.text);
      setIsGameOver(true);
      socket.emit('player_finished', { roomId, wpm: Math.round(wpm), accuracy });
    }
  };

  const calculateAccuracy = (typed, original) => {
    let correctChars = 0;
    // Iterate only up to the length of the typed string
    for (let i = 0; i < typed.length; i++) {
        // Check if the original character at this position exists and matches
        if (original[i] && original[i] === typed[i]) {
            correctChars++;
        }
    }
    // The accuracy is based on how many correct characters you got out of the total possible
    return Math.round((correctChars / original.length) * 100);
  };
  
  const accuracy = calculateAccuracy(inputValue, gameState.text);
  const progress = (inputValue.length / gameState.text.length) * 100;

  return (
    <div className="w-full h-screen bg-gray-900 flex flex-col relative">
      {isGameOver && <ResultsModal players={gameState.players} />}
      <main className="flex-1 flex flex-col justify-center">
        <RocketDisplay players={gameState.players} />
        <ControlPanel
          targetText={gameState.text}
          inputValue={inputValue}
          onInputChange={handleInputChange}
          progress={progress}
          accuracy={accuracy}
        />
      </main>
    </div>
  );
};

export default Game;