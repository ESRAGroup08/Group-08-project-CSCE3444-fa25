import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom'; // Added useParams
import GameLeaderboard from './components/GameLeaderboard.jsx'; // Import GameLeaderboard

const Game = () => {
  const navigate = useNavigate();
  const { roomId } = useParams(); // Extract roomId from URL
  const [text, setText] = useState('Loading...');
  const [inputValue, setInputValue] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [progress, setProgress] = useState(0);
  const difficulty = 'medium'; // Added difficulty definition

  useEffect(() => {
    let textToSet = '';
    switch (difficulty) {
      case 'easy':
        textToSet = 'The quick brown fox jumps over the lazy dog.';
        break;
      case 'hard':
        textToSet = 'Supercalifragilisticexpialidocious pneumatic pseudocode exemplifies paradoxical idiosyncrasies.';
        break;
      case 'medium':
      default:
        textToSet = 'A journey of a thousand miles begins with a single step. To be or not to be, that is the question.';
    }
    setText(textToSet);
    setInputValue('');
  }, [difficulty]);

  const textCharacters = useMemo(() => text.split(''), [text]);

  useEffect(() => {
    if (inputValue.length === 1 && !startTime) {
      setStartTime(Date.now());
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
      setProgress((inputValue.length / text.length) * 100);
    }

    if (inputValue.length === 0) {
      setProgress(0);
    }

    if (inputValue === text) {
      const elapsedTime = (Date.now() - startTime) / 1000;
      navigate('/results', { state: { elapsedTime, wpm, accuracy } });
    }
  }, [inputValue, startTime, text, navigate, wpm, accuracy]);

  const getCharClass = (char, index) => {
    if (index === inputValue.length) {
      return 'current';
    }
    if (index < inputValue.length) {
      return char === inputValue[index] ? 'correct' : 'incorrect';
    }
    return '';
  };

  return (
    <div className="w-full h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
      <div className="w-1/2 text-center">
        <h2 className="text-3xl font-bold mb-4">Type the following:</h2>
        <div className="text-2xl mb-8 bg-gray-800 p-4 rounded-lg font-mono">
          {textCharacters.map((char, index) => (
            <span key={index} className={getCharClass(char, index)}>
              {char}
            </span>
          ))}
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5 mb-4">
          <div 
            className="bg-cyan-500 h-2.5 rounded-full" 
            style={{ width: `${progress}%`, transition: 'width 0.1s linear' }}
          ></div>
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
          autoFocus
        />
        <div className="flex justify-around w-full mt-4 text-xl">
          <p>Time: {startTime ? Math.round((Date.now() - startTime) / 1000) : 0}s</p>
          <p>WPM: {wpm}</p>
          <p>Accuracy: {accuracy}%</p>
        </div>
        {/* Render GameLeaderboard */}
        <GameLeaderboard roomId={roomId} />
      </div>
    </div>
  );
};

export default Game;