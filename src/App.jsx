import React from 'react';
import { Outlet } from 'react-router-dom';
import io from 'socket.io-client';

const SERVER_URL = import.meta.env.PROD ? '/' : 'http://localhost:3000';
const socket = io(SERVER_URL);

function App() {
  return (
    <div className="App">
      <Outlet context={{ socket }} />
    </div>
  );
}

export default App;