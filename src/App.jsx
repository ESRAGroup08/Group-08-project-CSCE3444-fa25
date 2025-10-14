import React, { useState } from 'react';
import Login from './Login';
import Game from './Game';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [gameState, setGameState] = useState('not-started'); // 'not-started', 'in-progress', 'finished'
  const [finalTime, setFinalTime] = useState(0);
  const [finalWpm, setFinalWpm] = useState(0);
  const [finalAccuracy, setFinalAccuracy] = useState(0);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleStartGame = () => {
    setGameState('in-progress');
  };

  const handleGameOver = (time, wpm, accuracy) => {
    setGameState('finished');
    setFinalTime(time);
    setFinalWpm(wpm);
    setFinalAccuracy(accuracy);
  };

  const handlePlayAgain = () => {
    setGameState('not-started');
  };

  const renderContent = () => {
    if (!isLoggedIn) {
      return <Login onLogin={handleLogin} />;
    }

    switch (gameState) {
      case 'in-progress':
        return <Game onGameOver={handleGameOver} />;
      case 'finished':
        return (
          <div className="w-full h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
            <h1 className="text-5xl font-bold mb-4">Game Over!</h1>
            <div className="text-2xl mb-8 text-center">
              <p>Time: {finalTime.toFixed(2)}s</p>
              <p>WPM: {finalWpm}</p>
              <p>Accuracy: {finalAccuracy}%</p>
            </div>
            <button 
              onClick={handlePlayAgain}
              className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xl px-12 py-4 rounded-lg">
              Play Again
            </button>
          </div>
        );
      case 'not-started':
      default:
        return (
          <div className="w-full h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
            <h1 className="text-7xl font-bold mb-8">Galactic Typer</h1>
            <button 
              onClick={handleStartGame}
              className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xl px-12 py-4 rounded-lg">
              Start Game
            </button>
          </div>
        );
    }
  };

  return <div>{renderContent()}</div>;
};

export default App;