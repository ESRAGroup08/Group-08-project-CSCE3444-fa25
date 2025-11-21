import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useParams, useOutletContext, useNavigate } from 'react-router-dom';
import Countdown from './Countdown';
import { RocketDisplay } from './components/RocketDisplay.jsx';
import { ControlPanel } from './components/ControlPanel.jsx';
import Results from './Results'; // We'll show results directly here

const Game = () => {
  const navigate = useNavigate();
  const { socket } = useOutletContext();
  const { roomId } = useParams();
  const location = useLocation();

  // Game State
  const [text, setText] = useState('Waiting for game to start...');
  const [players, setPlayers] = useState({});
  const [inputValue, setInputValue] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [progress, setProgress] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);

  // UI State
  const [isCountingDown, setIsCountingDown] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [results, setResults] = useState(null);
  
  // Set initial game data from the location state passed by the Lobby
  useEffect(() => {
    const gameData = location.state?.gameData;
    if (gameData) {
      setText(gameData.text);
      setPlayers(gameData.players);
    } else {
      // Handle case where user navigates directly to the URL without matchmaking
      setText("Error: Game room not found or invalid. Please return to the lobby.");
      setIsCountingDown(false);
    }
  }, [location.state]);

  // Socket.IO event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('opponent_progress', ({ playerId, progress, wpm }) => {
      setPlayers(prev => ({
        ...prev,
        [playerId]: { ...prev[playerId], progress, wpm }
      }));
    });

    socket.on('game_over', (data) => {
      setResults(data.players);
      setGameOver(true);
    });

    // Clean up listeners
    return () => {
      socket.off('opponent_progress');
      socket.off('game_over');
    };
  }, [socket, roomId]);
  
  // Memoized values for performance
  const textCharacters = useMemo(() => text.split(''), [text]);
  const localPlayerId = useMemo(() => socket?.id, [socket]);

  // Handle input changes and calculate stats
  useEffect(() => {
    if (!gameStarted || !startTime || !localPlayerId) return;

    const correctChars = inputValue.split('').reduce((acc, char, index) => {
      return acc + (char === textCharacters[index] ? 1 : 0);
    }, 0);
    
    const newAccuracy = (correctChars / inputValue.length) * 100 || 100;
    setAccuracy(newAccuracy);

    const newProgress = (inputValue.length / text.length) * 100;
    setProgress(newProgress);
    
    const elapsedTime = (Date.now() - startTime) / 60000; // in minutes
    const newWpm = Math.round((inputValue.length / 5) / elapsedTime) || 0;
    setWpm(newWpm);

    // Send progress to server
    socket.emit('player_progress', { roomId, progress: newProgress, wpm: newWpm });

    // Check for game finish
    if (inputValue.length === text.length) {
      socket.emit('player_finished', { roomId, wpm: newWpm, accuracy: newAccuracy });
      setGameStarted(false); // Stop input
    }
  }, [inputValue, startTime, text, gameStarted, socket, roomId, localPlayerId]);

  const handleInputChange = (e) => {
    if (gameStarted) {
      // Start timer on first character typed
      if (inputValue.length === 0) {
        setStartTime(Date.now());
      }
      setInputValue(e.target.value);
    }
  };
  
  const onCountdownFinish = () => {
    setIsCountingDown(false);
    setGameStarted(true);
    setStartTime(Date.now()); // Set start time for everyone
  };

  // Render different views based on game state
  if (isCountingDown) {
    return <Countdown onCountdownFinish={onCountdownFinish} />;
  }

  if (gameOver && results) {
    const localPlayer = results[localPlayerId];
    // This is a simplified results view. You can use your `Results.jsx` component
    // by navigating to it and passing state, similar to how Lobby navigates here.
    return (
        <div className="w-full h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
            <h1 className="text-5xl font-bold mb-8">Race Over!</h1>
            <div className="bg-gray-800/50 backdrop-blur border border-cyan-500/30 rounded-lg p-8 text-center">
                <h2 className="text-3xl mb-4">Your Results:</h2>
                <p className="text-2xl mb-2">WPM: {localPlayer.wpm}</p>
                <p className="text-2xl mb-6">Accuracy: {Math.round(localPlayer.accuracy)}%</p>
                <button onClick={() => navigate('/lobby')} className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xl px-12 py-3 rounded-lg mt-4">
                    Back to Lobby
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      {/* Display for multiple players */}
      <div className="w-full max-w-4xl mx-auto mb-4">
        {Object.entries(players).map(([id, player]) => (
            <div key={id} className="mb-2">
              <p className="text-lg">{player.username} {id === localPlayerId ? '(You)' : ''}</p>
              <div className="w-full bg-gray-700 rounded-full h-4">
                <div 
                  className="bg-cyan-400 h-4 rounded-full transition-all duration-150" 
                  style={{ width: `${player.progress || 0}%` }}
                ></div>
              </div>
              <p className="text-sm text-right">{Math.round(player.wpm || 0)} WPM</p>
            </div>
        ))}
      </div>
      
      <ControlPanel
        targetText={text}
        inputValue={inputValue}
        onInputChange={handleInputChange}
        progress={progress}
        accuracy={accuracy}
        isDisabled={!gameStarted}
      />
    </div>
  );
};

export default Game;