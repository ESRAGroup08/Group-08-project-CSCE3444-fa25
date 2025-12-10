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
        <p>No scores yet — finish a game to appear here!</p>
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

