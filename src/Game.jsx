import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useOutletContext, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ControlPanel } from './components/ControlPanel';
import { RocketDisplay } from './components/RocketDisplay';
import ResultsModal from './components/ResultsModal';

const Game = () => {
  const { socket } = useOutletContext();
  const { roomId } = useParams();
  const location = useLocation();
  
  // Initialize state from router state if available
  const [gameState, setGameState] = useState(location.state || null);
  const [inputValue, setInputValue] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [isGameOver, setIsGameOver] = useState(false);

  // FORCE DEMO MODE: Detect 'demo' in URL and load data immediately
  useEffect(() => {
    if (roomId === 'demo') {
      setGameState({
        text: "The quick brown fox jumps over the lazy dog near the riverbank.",
        players: {
          'player1': { wpm: 0, progress: 0, name: 'You' },
          'player2': { wpm: 0, progress: 0, name: 'Ghost' },
          'player3': null,
          'player4': null
        },
        state: 'active'
      });
    }
  }, [roomId]);

  // Handling input
  const handleInputChange = (e) => {
    if (isGameOver || !gameState || !gameState.text) return;

    const typedValue = e.target.value;
    const currentPosition = inputValue.length;

    // 1. Prevent deleting (Race Mode)
    if (typedValue.length < currentPosition) {
      setInputValue(typedValue);
      return;
    }

    // 2. STRICT TYPING: Only allow correct character
    if (typedValue.charAt(typedValue.length - 1) === gameState.text.charAt(currentPosition)) {
      if (!startTime) setStartTime(Date.now());
      setInputValue(typedValue);

      const progress = ((typedValue.length / gameState.text.length) * 100);
      const elapsedSeconds = (Date.now() - startTime) / 1000;
      const wpm = elapsedSeconds > 0 ? (typedValue.length / 5) / (elapsedSeconds / 60) : 0;

      // Update visual state immediately
      setGameState(prev => ({
        ...prev,
        players: {
          ...prev.players,
          'player1': { ...prev.players['player1'], progress, wpm: Math.round(wpm) }
        }
      }));

      // Check for finish
      if (typedValue.length === gameState.text.length) {
        setIsGameOver(true);
      }
    }
  };

  // Loading State (Prevents flashing Error screen)
  if (!gameState && roomId === 'demo') {
    return <div className="w-full h-screen bg-gray-900 text-white flex items-center justify-center">Initializing Demo...</div>;
  }

  // Error State (Only if NOT demo and no state)
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

  const progress = (inputValue.length / gameState.text.length) * 100;

  return (
    <div className="w-full min-h-screen bg-gray-900 flex flex-col relative w-full max-w-[95%] mx-auto py-8">
      {isGameOver && <ResultsModal players={gameState.players} onClose={() => window.location.reload()} />}
      
      <main className="flex-1 flex flex-col justify-center">
        <RocketDisplay players={gameState.players} />
        <ControlPanel 
          targetText={gameState.text}
          inputValue={inputValue}
          onInputChange={handleInputChange}
          progress={progress}
        />
      </main>
    </div>
  );
};

export default Game;