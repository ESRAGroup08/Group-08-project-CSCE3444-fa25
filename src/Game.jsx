import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';

const Game = () => {
  const { state } = useLocation(); // Get data passed from navigate()
  const { socket } = useOutletContext(); // Get the shared socket
  
  // Extract game data passed from App.jsx
  const gameData = state?.gameData;
  
  const [text, setText] = useState('Loading...');
  const [inputValue, setInputValue] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [progress, setProgress] = useState(0);
  
  // --- NEW: State for opponent's progress ---
  const [opponentProgress, setOpponentProgress] = useState(0);
  
  const difficulty = 'medium'; 

  useEffect(() => {
    let textToSet = 'A journey of a thousand miles begins with a single step. To be or not to be, that is the question.';
    setText(textToSet);
    setInputValue('');
  }, [difficulty]);

  const textCharacters = useMemo(() => text.split(''), [text]);
  
  // This effect handles local typing logic and sends progress to the server.
  useEffect(() => {
    if (inputValue.length === 1 && !startTime) {
      setStartTime(Date.now());
    }

    const newProgress = (inputValue.length / text.length) * 100;
    setProgress(newProgress);
    
    // --- NEW: Send progress to the server ---
    if (socket && gameData) {
      socket.emit('game:progress', { roomId: gameData.roomId, progress: newProgress });
    }

    if (inputValue.length > 0 && startTime) {
      const elapsedTime = (Date.now() - startTime) / 1000;
      const wordsTyped = inputValue.length / 5;
      setWpm(Math.round((wordsTyped / elapsedTime) * 60));

      let correctChars = 0;
      for (let i = 0; i < inputValue.length; i++) {
        if (inputValue[i] === text[i]) {
          correctChars++;
        }
      }
      setAccuracy(Math.round((correctChars / inputValue.length) * 100));
    }

    if (inputValue === text) {
      // Handle game finish logic here
      console.log("Game finished!");
      // You would navigate to a results screen, e.g., navigate('/results', ...);
    }
  }, [inputValue, startTime, text, socket, gameData]);
  
  // --- NEW: Listen for opponent's progress updates ---
  useEffect(() => {
    if (!socket) return;
    
    const onOpponentProgress = (data) => {
        // Make sure the progress update is not from yourself
        if (data.socketId !== socket.id) {
            setOpponentProgress(data.progress);
        }
    };
    
    socket.on('game:progressUpdate', onOpponentProgress);
    
    return () => {
      socket.off('game:progressUpdate', onOpponentProgress);
    };
  }, [socket]);


  const getCharClass = (char, index) => {
    if (index === inputValue.length) return 'current';
    if (index < inputValue.length) return char === inputValue[index] ? 'correct' : 'incorrect';
    return '';
  };

  return (
    <div className="w-full h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
      <div className="w-1/2 text-center">
        {/* Opponent's Progress Bar */}
        <div className="mb-2">
            <p className="text-sm text-left">Opponent</p>
            <div className="w-full bg-red-700 rounded-full h-2.5">
                <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${opponentProgress}%` }}></div>
            </div>
        </div>
        
        {/* Your Progress Bar */}
        <div className="w-full bg-gray-700 rounded-full h-2.5 mb-4">
          <div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.1s linear' }}></div>
        </div>

        <div className="text-2xl mb-8 bg-gray-800 p-4 rounded-lg font-mono">
          {textCharacters.map((char, index) => (
            <span key={index} className={getCharClass(char, index)}>{char}</span>
          ))}
        </div>
        
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
          autoFocus
        />
        <div className="flex justify-around w-full mt-4 text-xl">
          <p>WPM: {wpm}</p>
          <p>Accuracy: {accuracy}%</p>
        </div>
      </div>
    </div>
  );
};

export default Game;