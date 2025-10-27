import React, { useState, useEffect } from 'react';

const Countdown = ({ onCountdownFinish }) => {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count === 'Go!') {
      setTimeout(() => onCountdownFinish(), 500);
      return;
    }
    
    if (count > 1) {
      setTimeout(() => setCount(count - 1), 1000);
    } else if (count === 1) {
      setTimeout(() => setCount('Go!'), 1000);
    }
  }, [count, onCountdownFinish]);

  return (
    <div className="w-full h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
      <h1 className="text-9xl font-bold text-cyan-400" style={{ animation: 'pulse 1s infinite' }}>
        {count}
      </h1>
    </div>
  );
};

export default Countdown;