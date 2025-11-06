import React from 'react';
import { Outlet } from 'react-router-dom';
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

function App() {
  return (
    <div className="App">
      <header>
        <h1>Galactic Typing</h1>
      </header>
      <main>
        <Outlet context={{ socket }} />
      </main>
    </div>
  );
}

export default App;