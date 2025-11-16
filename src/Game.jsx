import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import GameLeaderboard from './components/GameLeaderboard.jsx'; // We'll keep the import for later
import { RocketDisplay } from './components/RocketDisplay.jsx';
import { ControlPanel } from './components/ControlPanel.jsx';

const Game = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [text, setText] = useState('Loading...');
  const [inputValue, setInputValue] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [progress, setProgress] = useState(0);
  const difficulty = 'medium'; 

  // --- THIS BLOCK IS NOW COMMENTED OUT ---
  // This was for testing. In a real game, the server will send the text.
  /*
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
  */
  // --- END OF COMMENTED BLOCK ---


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

    // Stop navigating to results for now, until the game is functional
    /*
    if (inputValue === text) {
      const elapsedTime = (Date.now() - startTime) / 1000;
      navigate('/results', { state: { elapsedTime, wpm, accuracy } });
    }
    */
  }, [inputValue, startTime, text, navigate, wpm, accuracy]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  return (
    <div className="w-full h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
      <RocketDisplay />
      
      {/* The GameLeaderboard was breaking the layout. 
        We can add it back later, perhaps inside the ControlPanel or as a modal.
      */}
      {/* <GameLeaderboard roomId={roomId} /> */}

      <ControlPanel
        targetText={text}
        inputValue={inputValue}
        onInputChange={handleInputChange}
        progress={progress}
        accuracy={accuracy}
      />
    </div>
  );
};

export default Game;