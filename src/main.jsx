import React from 'react';
import ReactDOM from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import App from './App.jsx';
import Login from './Login.jsx';
import MainMenu from './components/MainMenu.jsx';
import Lobby from './Lobby.jsx';
import LeaderboardPage from './pages/LeaderboardPage.jsx';
import Game from './Game.jsx'; 
import ErrorDisplay from "./ErrorDisplay.jsx";
import Profile from './Profile.jsx'; 
import Friends from './Friends.jsx'; 
import CustomLobby from './components/CustomLobby.jsx';
import DailyChallenges from './DailyChallenges.jsx'; // Make sure this import is here
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
      { path: '/game/:roomId', element: <Game /> },
      { path: '/profile', element: <Profile /> },
      { path: '/friends', element: <Friends /> },
      { path: '/challenges', element: <DailyChallenges /> }, // And make sure this route is here
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);