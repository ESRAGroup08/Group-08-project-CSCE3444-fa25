// src/App.jsx
import React, { useState } from "react";
import Lobby from "./components/Lobby";
import Game from "./Game"; // your existing Game.jsx

function App() {
  const [username] = useState(() => localStorage.getItem("username") || "Guest" + Math.floor(Math.random()*1000));
  const [inGame, setInGame] = useState(false);
  const [gameInit, setGameInit] = useState(null);

  function onEnterGame(payload) {
    setGameInit(payload);
    setInGame(true);
  }

  if (!inGame) {
    return <Lobby username={username} onEnterGame={onEnterGame} />;
  }
  return <Game init={gameInit} username={username} />;
}

export default App;
