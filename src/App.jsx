import React from 'react';
import { Outlet } from 'react-router-dom';
import io from 'socket.io-client';

// Use an environment variable to determine the server URL.
// Vite exposes these variables on the `import.meta.env` object.
const SERVER_URL = import.meta.env.VITE_SERVER_URL;

const socket = io(SERVER_URL);

function App() {
  return (
    <div className="App">
      <Outlet context={{ socket }} />
    </div>
  );
}

export default App;