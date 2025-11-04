import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App.jsx';
import Login from './Login.jsx';
import Lobby from './Lobby.jsx';
import Game from './Game.jsx';
import Leaderboard from './Leaderboard.jsx';
import Results from './Results.jsx';
import './index.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Login /> },
      { path: 'lobby', element: <Lobby /> },
      { path: 'game', element: <Game /> },
      { path: 'leaderboard', element: <Leaderboard /> },
      { path: 'results', element: <Results /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
