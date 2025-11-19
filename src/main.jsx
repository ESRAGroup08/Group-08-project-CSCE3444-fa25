import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// --- Import all your page components ---
import App from './App.jsx';
import Login from './Login.jsx';
import MainMenu from './components/MainMenu.jsx';
import Lobby from './Lobby.jsx';
import Game from './Game.jsx';
import './index.css';

const router = createBrowserRouter([
  // Route 1: The Login Page (standalone, does not use the App layout)
  {
    path: "/login",
    element: <Login />,
  },
  // Route 2: The Main Application Layout
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Login />,
      },
      {
        path: "menu",
        element: <MainMenu />,
      },
      {
        path: "lobby",
        element: <Lobby />,
      },
      // --- THIS IS THE MODIFIED ROUTE ---
      // It now correctly expects a gameType and a roomId
      {
        path: "game/:gameType/:roomId",
        element: <Game />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);