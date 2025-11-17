import React from 'react';
import ReactDOM from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import App from './App.jsx';
import Login from './Login.jsx';
import MainMenu from './components/MainMenu.jsx';
import Lobby from './Lobby.jsx';
import CustomLobby from './components/CustomLobby';
import LeaderboardPage from './pages/LeaderboardPage.jsx';
import Game from './Game.jsx'; // New import
import ErrorDisplay from "./ErrorDisplay.jsx";
import Profile from './Profile.jsx'; // Import the new Profile component
import './index.css';

const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorDisplay />,
    children: [
      { index: true, element: <Login /> },
      { path: '/menu', element: <MainMenu /> },
      { path: '/lobby', element: <Lobby /> },
      { path: '/lobby/custom', element: <CustomLobby /> },
      { path: '/leaderboard', element: <LeaderboardPage /> },
      { path: '/game/:roomId', element: <Game /> }, // New route
      { path: '/profile', element: <Profile /> }, // Add the new profile route
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
