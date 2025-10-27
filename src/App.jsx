import React, { useState } from 'react';
import Login from './Login';
import Game from './Game';
import Countdown from './Countdown'; // <-- F-04: Import Countdown

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [gameState, setGameState] = useState('not-started'); // 'not-started', 'in-progress', 'finished'
  const [difficulty, setDifficulty] = useState('medium'); // <-- F-05: Add difficulty state
  const [finalTime, setFinalTime] = useState(0);
  const [finalWpm, setFinalWpm] = useState(0);
  const [finalAccuracy, setFinalAccuracy] = useState(0);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  // F-05: Update handleStartGame to accept a difficulty
  const handleStartGame = (selectedDifficulty) => {
    setDifficulty(selectedDifficulty);
    setGameState('countdown'); // <-- F-04: Go to countdown first
  };

  // F-04: Create handler for when countdown finishes
  const handleCountdownFinish = () => {
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
      // F-04: Add countdown case
      case 'countdown':
        return <Countdown onCountdownFinish={handleCountdownFinish}/>;
      case 'in-progress':
        return <Game onGameOver={handleGameOver} difficulty = {difficulty} />;
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
            <div className = "flex gap-4">
              <button 
              onClick={() => handleStartGame('easy')}
                className="bg-green-500 hover:bg-green-400 text-white font-bold text-xl px-12 py-4 rounded-lg">
                Easy
              </button>
              <button
                onClick={() => handleStartGame('medium')}
                className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xl px-12 py-4 rounded-lg">
                Medium
              </button>
              <button
                onClick={() => handleStartGame('hard')}
                className="bg-red-500 hover:bg-red-400 text-white font-bold text-xl px-12 py-4 rounded-lg">
                Hard
            </button>
            </div>
          </div>
        );
    }
  };

  return <div>{renderContent()}</div>;
};

export default App;