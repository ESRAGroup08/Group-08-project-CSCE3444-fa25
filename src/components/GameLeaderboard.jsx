import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

let socket;
export default function GameLeaderboard({ roomId }) {
  const [board, setBoard] = useState([]);

  useEffect(() => {
    if (!socket) socket = io();
    function handler(data) {
      // data: [{ username, wpm, progress }]
      setBoard(
        [...data].sort((a, b) => {
          // sort by progress (completion) then wpm
          if (b.progress === a.progress) return b.wpm - a.wpm;
          return b.progress - a.progress;
        })
      );
    }
    socket.on('leaderboard_update', handler);

    // request initial leaderboard for this room
    if (roomId) socket.emit('leaderboard_request', { roomId });

    return () => {
      socket.off('leaderboard_update', handler);
    };
  }, [roomId]);

  return (
    <div className='bg-slate-900 border-y border-slate-700 p-4 mx-auto w-full max-w-4xl'>
      <h3 className='text-slate-400 text-sm tracking-widest mb-3 text-center uppercase'>Leaderboard</h3>
      <table className='w-full text-left'>
        <thead>
          <tr className='border-b border-slate-700'>
            <th className='p-2 text-xs text-slate-500 uppercase'>Rank</th>
            <th className='p-2 text-xs text-slate-500 uppercase'>Player</th>
            <th className='p-2 text-xs text-slate-500 uppercase'>WPM</th>
            <th className='p-2 text-xs text-slate-500 uppercase'>Progress</th>
          </tr>
        </thead>
        <tbody className='text-slate-300'>
          {board.length === 0 && (
            <tr>
              <td colSpan='4' className='p-2 text-center text-slate-500'>Waiting for players...</td>
            </tr>
          )}
          {board.map((p, i) => (
            <tr key={p.username || i} className='border-b border-slate-800 last:border-b-0'>
              <td className='p-2 tabular-nums'>{i + 1}</td>
              <td className='p-2'>{p.username}</td>
              <td className='p-2 tabular-nums'>{Math.round(p.wpm ?? 0)}</td>
              <td className='p-2 tabular-nums'>{Math.round((p.progress ?? 0) * 100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}