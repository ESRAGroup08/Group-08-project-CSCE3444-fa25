// src/components/Leaderboard.jsx
import React, { useEffect, useState } from "react";
import io from "socket.io-client";

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
    socket.on("leaderboard_update", handler);

    // request initial leaderboard for this room
    if (roomId) socket.emit("leaderboard_request", { roomId });

    return () => {
      socket.off("leaderboard_update", handler);
    };
  }, [roomId]);

  return (
    <div className="leaderboard">
      <h3>Leaderboard</h3>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>WPM</th>
            <th>Progress</th>
          </tr>
        </thead>
        <tbody>
          {board.length === 0 && (
            <tr>
              <td colSpan="4">Waiting for players...</td>
            </tr>
          )}
          {board.map((p, i) => (
            <tr key={p.username}>
              <td>{i + 1}</td>
              <td>{p.username}</td>
              <td>{Math.round(p.wpm ?? 0)}</td>
              <td>{Math.round((p.progress ?? 0) * 100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

