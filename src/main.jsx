import React from 'react';
import ReactDOM from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import App from './App.jsx';
import Login from './Login.jsx'; // Assuming this is your login page component
import MainMenu from './components/MainMenu.jsx'; // Assuming this is your main menu
import Lobby from './Lobby.jsx';
import CustomLobby from './components/CustomLobby';
import Leaderboard from './Leaderboard.jsx'; 
import Game from './Game.jsx';
import ErrorDisplay from "./ErrorDisplay.jsx";
import Profile from './Profile.jsx';
import './index.css';

const router = createHashRouter([
  {
    path: "/login",
    element: <Login />,
  },
  // Route 2: The Main Application Layout
  // This wraps all pages that come AFTER login.
  // It provides the socket connection via its <Outlet>.
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorDisplay />,
    children: [
      // When the user is at "/", show the MainMenu by default.
      // You can change this to redirect to "/login" if the user isn't authenticated.
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
      {
        path: "game/:roomId",
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