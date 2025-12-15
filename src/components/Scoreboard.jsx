// src/components/Scoreboard.jsx
import React, { useState, useEffect } from "react";

function Scoreboard() {
  const [scores, setScores] = useState([]);

  useEffect(() => {
    // Simulate leaderboard data (replace with backend later)
    const storedScores = JSON.parse(localStorage.getItem("leaderboard")) || [];
    setScores(storedScores.sort((a, b) => b.wpm - a.wpm));
  }, []);

  return (
    <div className="container">
      <h2>🏆 Leaderboard</h2>
      {scores.length === 0 ? (
        <div style={{ padding: '1rem', background: 'transparent' }}>
          <p style={{ color: 'var(--text-primary, white)', fontWeight: 700 }}>No game records available to show.</p>
          <p style={{ color: 'var(--text-secondary, #d1d5db)' }}>Play game to record the scoere</p>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>WPM</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((player, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{player.username}</td>
                <td>{player.wpm}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Scoreboard;

