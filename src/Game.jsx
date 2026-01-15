import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useParams, useOutletContext } from 'react-router-dom';
import { ControlPanel } from './components/ControlPanel';
import { RocketDisplay } from './components/RocketDisplay';
import ResultsModal from './components/ResultsModal';
import Perks from './components/Perks';

const Overlay = ({ title, subtext, showTimer, time, bigText }) => (
    <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center text-white">
        <div className={`font-bold ${bigText ? 'text-9xl text-yellow-400 animate-ping' : 'text-4xl'}`}>{title}</div>
        {subtext && <p className="mt-4 text-gray-400">{subtext}</p>}
        {showTimer && <div className="mt-6 text-yellow-400 text-xl">Starting in {time}s</div>}
    </div>
);

const SuddenDeathOverlay = ({ time }) => (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-red-600/90 backdrop-blur-sm border-2 border-red-400 rounded-lg p-4 text-white shadow-lg animate-pulse">
        <h3 className="text-2xl font-bold text-center">SUDDEN DEATH!</h3>
        <p className="text-lg text-center">Ending in <span className="font-bold text-yellow-300">{time}s</span></p>
    </div>
);

const Game = () => {
  const { socket } = useOutletContext();
  const { roomId } = useParams();
  const location = useLocation();
  
  const [gameState, setGameState] = useState(location.state || { status: 'loading', players: {} });
  const [inputValue, setInputValue] = useState('');
  const [myPlayerId, setMyPlayerId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [playerResult, setPlayerResult] = useState(null);
  const [selectedPerk, setSelectedPerk] = useState(null);
  const [perkUsed, setPerkUsed] = useState(false);
  const [isBlinded, setIsBlinded] = useState(false);
  const [isSystemLocked, setIsSystemLocked] = useState(false);
  
  const gameStateRef = useRef(gameState);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  useEffect(() => {
    if (!socket || !socket.connected || !roomId) return;
    setMyPlayerId(socket.id);
    const username = localStorage.getItem('username') || "Guest";
    socket.emit('join_specific_room', { roomId, username });

    const handleState = (data) => {
        if(!data) return;
        
        let localEndTime = null;
        if (data.status === 'waiting' && data.waitingTimeLeft !== null) {
            localEndTime = Date.now() + data.waitingTimeLeft;
        } else if (data.status === 'countdown' && data.countdownTimeLeft !== null) {
            localEndTime = Date.now() + data.countdownTimeLeft;
        } else if (data.status === 'sudden_death' && data.suddenDeathTimeLeft !== null) {
            localEndTime = Date.now() + data.suddenDeathTimeLeft;
        }

        setGameState(prev => ({
            ...prev,
            ...data,
            endTime: localEndTime
        }));

        if (data.status === 'playing' && !startTime) setStartTime(Date.now());
        if (data.status === 'finished') setIsGameOver(true);
    };

    const handlePerkEffect = ({ perkName, targetPlayerId }) => {
      if (targetPlayerId === socket.id) {
        if (perkName === 'Solar Flare') {
          setIsBlinded(true);
          setTimeout(() => setIsBlinded(false), 5000);
        } else if (perkName === 'System Hack') {
          setIsSystemLocked(true);
          setTimeout(() => setIsSystemLocked(false), 3000);
        } else if (perkName === 'Hyperdrive') {
            const currentText = gameStateRef.current.text || "";
            setInputValue(prev => {
                const currentLen = prev.length;
                if (currentLen >= currentText.length) return prev;
                
                const remainingText = currentText.slice(currentLen);
                let nextSpaceIdx = remainingText.indexOf(' ');
                if (nextSpaceIdx === -1) nextSpaceIdx = remainingText.length;
                else nextSpaceIdx += 1; // Include the space

                const nextWord = remainingText.slice(0, nextSpaceIdx);
                const newVal = prev + nextWord;
                
                socket.emit('player_progress', { roomId, typedLength: newVal.length, wpm: 0 });
                return newVal;
            });
        } else if (perkName === 'Tractor Beam') {
            setInputValue(prev => {
                if (prev.length === 0) return prev;
                const trimmed = prev.trimEnd();
                const lastSpaceIdx = trimmed.lastIndexOf(' ');
                
                let newVal = "";
                if (lastSpaceIdx === -1) newVal = ""; 
                else newVal = trimmed.slice(0, lastSpaceIdx + 1);
                
                socket.emit('player_progress', { roomId, typedLength: newVal.length, wpm: 0 });
                return newVal;
            });
        }
      }
    };

    socket.on('room_state', handleState);
    socket.on('players_update', (players) => setGameState(prev => ({ ...prev, players })));
    socket.on('game_over', ({ winnerId, players }) => {
        setGameState(prev => ({ ...prev, players, status: 'finished' }));
        setIsGameOver(true);
        setPlayerResult(socket.id === winnerId ? 'won' : 'lost');
    });
    socket.on('match_found', handleState);
    socket.on('perk_effect', handlePerkEffect);

    return () => {
        socket.off('room_state');
        socket.off('players_update');
        socket.off('game_over');
        socket.off('match_found');
        socket.off('perk_effect');
    };
  }, [socket, roomId]);

  useEffect(() => {
      if (!gameState.endTime) { setTimeLeft(null); return; }
      const interval = setInterval(() => {
          const diff = Math.ceil((gameState.endTime - Date.now()) / 1000);
          setTimeLeft(diff > 0 ? diff : 0);
      }, 100);
      return () => clearInterval(interval);
  }, [gameState.status, gameState.endTime]);

  useEffect(() => {
      const handleKeyDown = (e) => {
          if (e.key === '`') {
              handleActivatePerk();
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
          window.removeEventListener('keydown', handleKeyDown);
      };
  }, [selectedPerk, perkUsed]);

  const handleInputChange = (e) => {
      if (gameState.status !== 'playing' && gameState.status !== 'sudden_death') return;
      let val = e.target.value;
      
      if (!gameState.text || !gameState.text.startsWith(val)) return;
      setInputValue(val);
      const progress = (val.length / gameState.text.length) * 100;
      let wpm = 0;
      if (startTime) {
          const min = (Date.now() - startTime) / 60000;
          if (min > 0) wpm = Math.round((val.length / 5) / min);
      }

      if (val.length === gameState.text.length) socket.emit('player_finished', { roomId, wpm });
      else socket.emit('player_progress', { roomId, typedLength: val.length, wpm });
  };

  const handlePerkSelect = (perk) => {
    setSelectedPerk(perk);
    socket.emit('player_ready', { roomId, perk: perk.name });
  };

  const handleActivatePerk = () => {
    if (selectedPerk && !perkUsed) {
      setPerkUsed(true);
      socket.emit('activate_perk', { roomId, perkName: selectedPerk.name });
    }
  };

  const myPlayer = gameState.players?.[myPlayerId];
  const myProgress = myPlayer?.progress || 0;
  const showResults = isGameOver || myPlayer?.finished;
  const targetText = isBlinded ? gameState.text.replace(/[a-zA-Z]/g, '*') : gameState.text;

  return (
    <div className="w-full min-h-screen bg-gray-900 flex flex-col relative w-full max-w-[95%] mx-auto py-8">
        {!selectedPerk && gameState.status !== 'loading' && <Perks onSelectPerk={handlePerkSelect} />}
        {selectedPerk && (
            <>
                {showResults && <ResultsModal players={gameState.players} myPlayerId={myPlayerId} playerResult={playerResult} isGameOver={isGameOver} />}
                {gameState.status === 'loading' && <Overlay title="Loading..." />}
                {gameState.status === 'waiting' && <Overlay title="Waiting..." subtext={`(${Object.keys(gameState.players).length}/4)`} showTimer={!!gameState.endTime} time={timeLeft} />}
                {gameState.status === 'countdown' && <Overlay title={timeLeft} bigText={true} />}
                {gameState.status === 'sudden_death' && !myPlayer?.finished && <SuddenDeathOverlay time={timeLeft} />}
                {isSystemLocked && <Overlay title="SYSTEM LOCKOUT" subtext="Terminal Hacked" bigText={false} />}
                <div className="flex-1 flex flex-col justify-center">
                    <RocketDisplay players={gameState.players} />
                    <ControlPanel 
                        targetText={targetText || ""} 
                        inputValue={inputValue} 
                        onInputChange={handleInputChange} 
                        progress={myProgress} 
                        selectedPerk={selectedPerk}
                        onActivatePerk={handleActivatePerk}
                        perkUsed={perkUsed}
                        disabled={gameState.status !== 'playing' && gameState.status !== 'sudden_death' || myPlayer?.finished || isSystemLocked} 
                    />
                </div>
            </>
        )}
    </div>
  );
};

export default Game;