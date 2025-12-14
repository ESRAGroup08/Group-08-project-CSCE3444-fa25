const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const { randomUUID } = require('crypto');

const casualMatchmaking = require('./casualMatchmaking');
const ranking = require('./ranking');
const privateLobby = require('./privateLobby');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);

// --- CORS Configuration ---
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://group-08-project-csce3444-fa25.onrender.com",
  "https://group-08-multi-feat-preview.onrender.com"
];

const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ["GET", "POST"] },
  transports: ['polling', 'websocket'],
});

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/typing_game')
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- Middleware ---
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

/* --- API ROUTES (Simplified & Corrected) --- */

// Login Route (ensures user exists in DB)
app.post('/api/login', async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ message: "Username is required." });
  }
  try {
    await User.findOneAndUpdate(
      { username },
      { $setOnInsert: { username } }, // Only set username on creation
      { upsert: true, new: true }
    );
    res.status(200).json({
      message: "Logged in successfully",
      user: { username }
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// Auth Status Route (checks if a username exists)
app.get('/api/auth/status', async (req, res) => {
    const username = req.headers['x-username'];
    if (!username) {
        return res.json({ isAuthenticated: false, user: null });
    }
    try {
        const user = await User.findOne({ username });
        if (user) {
            res.json({ isAuthenticated: true, user: { username: user.username } });
        } else {
            res.json({ isAuthenticated: false, user: null });
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        res.status(500).json({ message: 'Server error during auth check.' });
    }
});


// GET user data for profile page
app.get('/api/users/:username', async (req, res) => {
    try {
        const paramUsername = req.params.username;
        const headerUsername = req.headers['x-username'];

        if (paramUsername !== headerUsername) {
            return res.status(403).json({ message: 'Forbidden: You can only view your own profile.' });
        }
        
        const user = await User.findOne({ username: paramUsername });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json({
            username: user.username,
            gamesPlayed: user.gamesPlayed,
            averageWPM: user.averageWPM,
            averageAccuracy: user.averageAccuracy,
        });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ message: 'Server error while fetching user data.' });
    }
});

// PUT (update) a user's username
app.put('/api/users/:username', async (req, res) => {
    try {
        const paramUsername = req.params.username;
        const headerUsername = req.headers['x-username'];
        const { newUsername } = req.body;

        if (paramUsername !== headerUsername) {
            return res.status(403).json({ message: 'Forbidden: You can only update your own profile.' });
        }

        if (!newUsername || newUsername.trim().length === 0) {
            return res.status(400).json({ message: 'New username cannot be empty.' });
        }

        const existingUser = await User.findOne({ username: newUsername });
        if (existingUser) {
            return res.status(409).json({ message: 'This username is already taken.' });
        }

        const user = await User.findOneAndUpdate(
            { username: paramUsername },
            { $set: { username: newUsername } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        
        res.json({
            message: 'Username updated successfully!',
            username: user.username,
            gamesPlayed: user.gamesPlayed,
            averageWPM: user.averageWPM,
            averageAccuracy: user.averageAccuracy,
        });
    } catch (error) {
        console.error('Error updating username:', error);
        res.status(500).json({ message: 'Server error while updating username.' });
    }
});

const PORT = process.env.PORT || 3000;

// --- Socket.IO Logic --- (This part is unchanged)
const TEXT_SNIPPETS = [
    'The quick brown fox jumps over the lazy dog.',
    'A journey of a thousand miles begins with a single step. To be or not to be, that is the question.',
    'Supercalifragilisticexpialidocious pneumatic pseudocode exemplifies paradoxical idiosyncrasies.',
];

const gameRooms = new Map();
const PERKS = ['ASTEROID_ATTACK', 'ROCKET_FUEL'];
const rankedQueue = [];

function startGameLoop(roomId) {
    const room = gameRooms.get(roomId);
    if (!room) return;
    const perkInterval = Math.random() * 2000 + 5000;
    room.gameInterval = setInterval(() => {
        const playerIds = Object.keys(room.players);
        const now = Date.now();
        const cooldown = 4000 + Math.random() * 1000;
        const eligiblePlayers = playerIds.filter(id => {
            const player = room.players[id];
            return !player.perk && (now - (player.perkUsedAt || 0) > cooldown);
        });
        if (eligiblePlayers.length > 0) {
            const randomPlayerId = eligiblePlayers[Math.floor(Math.random() * eligiblePlayers.length)];
            const randomPerk = PERKS[Math.floor(Math.random() * PERKS.length)];
            room.players[randomPlayerId].perk = randomPerk;
            io.to(randomPlayerId).emit('perk_granted', { perk: randomPerk });
        }
    }, perkInterval);
}

function stopGameLoop(roomId) {
    const room = gameRooms.get(roomId);
    if (room && room.gameInterval) {
        clearInterval(room.gameInterval);
        delete room.gameInterval;
    }
}

io.on('connection', (socket) => {
    console.log('a user connected:', socket.id);
    socket.on('join_casual', async ({ username }) => {
        try {
            const user = await User.findOne({ username: username });
            let stats = user ? { wpm: user.averageWPM, accuracy: user.averageAccuracy, gamesPlayed: user.gamesPlayed } : { wpm: 50, accuracy: 95, gamesPlayed: 10 };
            await User.findOneAndUpdate({ username }, { $setOnInsert: { username } }, { upsert: true });
            const skillScore = ranking.computeSkillScore(stats);
            const result = casualMatchmaking.enqueue({ socket, username, stats, skillScore });
            if (result.matched) {
                const { self, opponent } = result;
                const roomId = randomUUID();
                const text = TEXT_SNIPPETS[Math.floor(Math.random() * TEXT_SNIPPETS.length)];
                const roomState = {
                    roomId, text,
                    players: {
                        [self.socket.id]: { username: self.username, progress: 0, wpm: 0, finished: false, perk: null, perkUsedAt: 0 },
                        [opponent.socket.id]: { username: opponent.username, progress: 0, wpm: 0, finished: false, perk: null, perkUsedAt: 0 },
                    }
                };
                gameRooms.set(roomId, roomState);
                self.socket.join(roomId);
                opponent.socket.join(roomId);
                io.to(roomId).emit('match_found', { roomId, players: roomState.players, text });
                startGameLoop(roomId);
            } else {
                socket.emit('waiting_for_match');
            }
        } catch (error) {
            console.error('Error during matchmaking:', error);
            socket.emit('matchmaking_error', { message: 'An error occurred while trying to find a match.' });
        }
    });
    // ... other socket handlers are unchanged ...
    socket.on('join_ranked', ({ username }) => {
        if (rankedQueue.some(p => p.username === username)) {
            socket.emit('waiting_for_match');
            return;
        }
        const rank = ranking.getRating(username);
        ranking.ensurePlayer(username);
        const opponentIndex = rankedQueue.findIndex(p => p.username !== username && Math.abs(p.rank - rank) <= 50);
        if (opponentIndex !== -1) {
            const opponent = rankedQueue.splice(opponentIndex, 1)[0];
            const roomId = randomUUID();
            const text = TEXT_SNIPPETS[Math.floor(Math.random() * TEXT_SNIPPETS.length)];
            const roomState = {
                roomId, text, isRanked: true,
                players: {
                    [socket.id]: { username, rank, progress: 0, wpm: 0, finished: false, perk: null, perkUsedAt: 0 },
                    [opponent.socket.id]: { username: opponent.username, rank: opponent.rank, progress: 0, wpm: 0, finished: false, perk: null, perkUsedAt: 0 },
                }
            };
            gameRooms.set(roomId, roomState);
            socket.join(roomId);
            opponent.socket.join(roomId);
            io.to(roomId).emit('match_found', roomState);
            startGameLoop(roomId);
        } else {
            rankedQueue.push({ socket, username, rank });
            socket.emit('waiting_for_match');
        }
    });
    socket.on('create_lobby', ({ username }) => {
        try {
            const { roomId, roomState } = privateLobby.createRoom({ hostUsername: username, socket });
            socket.join(roomId);
            socket.emit('lobby_state_update', { roomId, ...roomState });
        } catch (error) { socket.emit('lobby_error', { message: error.message }); }
    });
    socket.on('join_lobby', ({ username, roomId }) => {
        try {
            const { roomState } = privateLobby.joinRoom({ roomId, username, socket });
            socket.join(roomId);
            io.to(roomId).emit('lobby_state_update', { roomId, ...roomState });
        } catch (error) { socket.emit('lobby_error', { message: error.message }); }
    });
    socket.on('set_ready', ({ roomId, username, isReady }) => {
        try {
            const { roomState } = privateLobby.setReady(roomId, username, isReady);
            io.to(roomId).emit('lobby_state_update', { roomId, ...roomState });
        } catch (error) { socket.emit('lobby_error', { message: error.message }); }
    });
    socket.on('start_game', ({ roomId, username }) => {
        try {
            const publicLobby = privateLobby.getLobbyByRoomId(roomId);
            if (!publicLobby) throw new Error("Lobby not found.");
            if (publicLobby.host !== username) throw new Error("Only the host can start the game.");
            if (!privateLobby.allReady(roomId)) throw new Error("Not all players are ready.");
            const text = TEXT_SNIPPETS[Math.floor(Math.random() * TEXT_SNIPPETS.length)];
            const playersState = {};
            const playersMap = publicLobby.players;
            playersMap.forEach(player => {
                playersState[player.socket.id] = { username: player.username, progress: 0, wpm: 0, finished: false, perk: null, perkUsedAt: 0 };
            });
            gameRooms.set(roomId, { roomId, text, players: playersState });
            io.to(roomId).emit('game_starting', { roomId, players: playersState, text });
            startGameLoop(roomId);
        } catch (error) {
            socket.emit('lobby_error', { message: error.message });
        }
    });
    socket.on('player_progress', ({ roomId, progress, wpm }) => {
        const room = gameRooms.get(roomId);
        if (room && room.players[socket.id]) {
            room.players[socket.id].progress = progress;
            room.players[socket.id].wpm = wpm;
            socket.to(roomId).emit('opponent_progress', { playerId: socket.id, progress, wpm });
        }
    });
    socket.on('use_perk', ({ roomId, perk }) => {
        const room = gameRooms.get(roomId);
        const player = room?.players[socket.id];
        if (!player || player.perk !== perk) return;
        player.perk = null;
        player.perkUsedAt = Date.now();
        socket.emit('perk_used');
        if (perk === 'ASTEROID_ATTACK') {
            socket.to(roomId).emit('asteroid_hit');
        } else if (perk === 'ROCKET_FUEL') {
            const currentProgress = player.progress || 0;
            const text = room.text;
            const currentLength = Math.floor(text.length * (currentProgress / 100));
            const boostLength = Math.floor(text.length * 0.25);
            const autoCompletedText = text.substring(currentLength, currentLength + boostLength);
            socket.emit('perk_effect_rocket_fuel', { autoCompletedText });
        }
    });
    async function endGame(roomId) {
        const room = gameRooms.get(roomId);
        if (!room) return;
        if (room.suddenDeathTimer) {
            clearTimeout(room.suddenDeathTimer);
            delete room.suddenDeathTimer;
        }
        for (const playerId in room.players) {
            const player = room.players[playerId];
            if (player.finished) {
                await User.findOneAndUpdate(
                    { username: player.username },
                    {
                        $inc: { gamesPlayed: 1 },
                        $set: { averageWPM: player.wpm, averageAccuracy: player.accuracy }
                    },
                    { upsert: true }
                );
            }
        }
        const finishedPlayers = Object.values(room.players).filter(p => p.finished);
        if (finishedPlayers.length > 0) {
            const winner = finishedPlayers.reduce((prev, current) => ((current.wpm || 0) > (prev.wpm || 0)) ? current : prev);
            const loser = finishedPlayers.find(p => p.username !== winner.username);
            if (room.isRanked && loser) {
                const newRatings = ranking.updateRatings(winner.username, loser.username, 1);
                winner.newRank = newRatings[winner.username];
                loser.newRank = newRatings[loser.username];
            }
        }
        io.to(roomId).emit('game_over', { players: room.players });
        stopGameLoop(roomId);
        setTimeout(() => gameRooms.delete(roomId), 10000);
    }
    socket.on('player_finished', async ({ roomId, wpm, accuracy }) => {
        const room = gameRooms.get(roomId);
        if (!room || !room.players[socket.id] || room.players[socket.id].finished) return;
        const playerState = room.players[socket.id];
        playerState.finished = true;
        playerState.wpm = wpm;
        playerState.accuracy = accuracy;
        io.to(roomId).emit('opponent_progress', {
            playerId: socket.id,
            progress: 100,
            wpm: Math.round(wpm),
            finished: true
        });
        const playerStates = Object.values(room.players);
        const finishedCount = playerStates.filter(p => p.finished).length;
        const totalPlayers = playerStates.length;
        if (finishedCount === totalPlayers) {
            if (room.suddenDeathTimer) clearTimeout(room.suddenDeathTimer);
            await endGame(roomId);
        } else if (finishedCount === 1 && totalPlayers > 1) {
            const countdownDuration = 15;
            io.to(roomId).emit('suddenDeath', { duration: countdownDuration });
            room.suddenDeathTimer = setTimeout(async () => {
                await endGame(roomId);
            }, countdownDuration * 1000);
        } else if (totalPlayers === 1) {
            await endGame(roomId);
        }
    });
    socket.on('disconnect', () => {
        console.log('user disconnected:', socket.id);
        casualMatchmaking.removeBySocket(socket);
        const affectedLobbies = privateLobby.removePlayerBySocket(socket);
        affectedLobbies.forEach(lobby => {
            if (lobby.roomState) {
                io.to(lobby.roomId).emit('lobby_state_update', { roomId: lobby.roomId, ...lobby.roomState });
            }
        });
    });
});


// Final catch-all to serve the React app
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// --- Start the Server ---
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server listening on 0.0.0.0:${PORT}`);
});