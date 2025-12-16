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
  "https://group-08-multi-feat-preview.onrender.com",
  "https://galactic-typing.onrender.com" // ADD THIS LINE
];

const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ["GET", "POST"] },
  transports: ['polling', 'websocket'],
});

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://game_user:testuser123@gltp0.tez957z.mongodb.net/?appName=GLTP0')
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- Middleware ---
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

/* --- API ROUTES --- */

app.post('/api/login', async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ message: "Username is required." });
  try {
    await User.findOneAndUpdate({ username }, { $setOnInsert: { username } }, { upsert: true, new: true });
    res.status(200).json({ message: "Logged in successfully", user: { username } });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login.' });
  }
});

app.get('/api/auth/status', async (req, res) => {
    const username = req.headers['x-username'];
    if (!username) return res.json({ isAuthenticated: false, user: null });
    try {
        const user = await User.findOne({ username });
        res.json({ isAuthenticated: !!user, user: user ? { username: user.username } : null });
    } catch (error) {
        res.status(500).json({ message: 'Server error during auth check.' });
    }
});

app.get('/api/users/search', async (req, res) => {
    const { query } = req.query;
    const currentUsername = req.headers['x-username'];
    if (!query) return res.status(400).json({ message: 'Search query is required.' });
    try {
        const currentUser = await User.findOne({ username: currentUsername });
        if (!currentUser) return res.status(404).json({ message: 'Authenticated user not found.' });

        const users = await User.find({
            username: { $regex: query, $options: 'i' },
            _id: { $ne: currentUser._id }
        }).limit(20);
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error while searching for users.' });
    }
});

app.get('/api/friends', async (req, res) => {
    const username = req.headers['x-username'];
    if (!username) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const user = await User.findOne({ username })
            .populate('friends', 'username')
            .populate('friendRequestsSent', 'username')
            .populate('friendRequestsReceived', 'username');

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({
            friends: user.friends,
            sentRequests: user.friendRequestsSent,
            receivedRequests: user.friendRequestsReceived,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching friends data.' });
    }
});

app.post('/api/friend-request', async (req, res) => {
    const { recipientId } = req.body;
    const senderUsername = req.headers['x-username'];

    try {
        const sender = await User.findOne({ username: senderUsername });
        const recipient = await User.findById(recipientId);

        if (!recipient || !sender) return res.status(404).json({ message: 'User not found.' });

        if (sender.friends.includes(recipient._id) || sender.friendRequestsSent.includes(recipient._id)) {
            return res.status(400).json({ message: 'Friend request already sent or already friends.' });
        }
        
        await User.updateOne({ _id: sender._id }, { $addToSet: { friendRequestsSent: recipient._id } });
        await User.updateOne({ _id: recipient._id }, { $addToSet: { friendRequestsReceived: sender._id } });

        res.status(200).json({ message: 'Friend request sent successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error while sending friend request.' });
    }
});

app.post('/api/friend-request/respond', async (req, res) => {
    const { requesterId, action } = req.body;
    const recipientUsername = req.headers['x-username'];

    try {
        const recipient = await User.findOne({ username: recipientUsername });
        const requester = await User.findById(requesterId);

        if (!recipient || !requester) return res.status(404).json({ message: 'User not found' });

        await User.updateOne({ _id: recipient._id }, { $pull: { friendRequestsReceived: requester._id } });
        await User.updateOne({ _id: requester._id }, { $pull: { friendRequestsSent: recipient._id } });

        if (action === 'accept') {
            await User.updateOne({ _id: recipient._id }, { $addToSet: { friends: requester._id } });
            await User.updateOne({ _id: requester._id }, { $addToSet: { friends: recipient._id } });
        }
        
        res.status(200).json({ message: `Friend request ${action}ed.` });
    } catch (error) {
        res.status(500).json({ message: 'Server error while responding to friend request.' });
    }
});

app.post('/api/friend/remove', async (req, res) => {
    const { friendId } = req.body;
    const currentUsername = req.headers['x-username'];

    try {
        const currentUser = await User.findOne({ username: currentUsername });
        const friend = await User.findById(friendId);

        if (!currentUser || !friend) return res.status(404).json({ message: 'User not found.' });
        
        await User.updateOne({ _id: currentUser._id }, { $pull: { friends: friend._id } });
        await User.updateOne({ _id: friend._id }, { $pull: { friends: currentUser._id } });

        res.status(200).json({ message: 'Friend removed successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error while removing friend.' });
    }
});


app.get('/api/users/:username', async (req, res) => {
    try {
        if (req.params.username !== req.headers['x-username']) return res.status(403).json({ message: 'Forbidden' });
        const user = await User.findOne({ username: req.params.username });
        if (!user) return res.status(404).json({ message: 'User not found.' });
        res.json({
            username: user.username,
            gamesPlayed: user.gamesPlayed,
            averageWPM: user.averageWPM,
            averageAccuracy: user.averageAccuracy,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching user data.' });
    }
});

app.put('/api/users/:username', async (req, res) => {
    try {
        if (req.params.username !== req.headers['x-username']) return res.status(403).json({ message: 'Forbidden' });
        const { newUsername } = req.body;
        if (!newUsername || newUsername.trim().length === 0) return res.status(400).json({ message: 'New username cannot be empty.' });
        if (await User.findOne({ username: newUsername })) return res.status(409).json({ message: 'This username is already taken.' });
        const user = await User.findOneAndUpdate({ username: req.params.username }, { $set: { username: newUsername } }, { new: true });
        if (!user) return res.status(404).json({ message: 'User not found.' });
        res.json({ message: 'Username updated successfully!', username: user.username, gamesPlayed: user.gamesPlayed, averageWPM: user.averageWPM, averageAccuracy: user.averageAccuracy });
    } catch (error) {
        res.status(500).json({ message: 'Server error while updating username.' });
    }
});

const PORT = process.env.PORT || 3000;

// --- Socket.IO Logic ---
const TEXT_SNIPPETS = [
    'The cosmos is vast and full of wonders, from shimmering nebulas to swirling galaxies.',
    'A lone spaceship drifted through the asteroid field, its pilot expertly dodging the floating rocks.',
    'Quantum mechanics is the theoretical basis of modern physics that explains the nature and behavior of matter and energy on the atomic and subatomic level.',
];

const gameRooms = new Map();
// MERGED: Added new perks from remote branch
const PERKS = ['ASTEROID_ATTACK', 'ROCKET_FUEL', 'REPULSOR_WAVE', 'NEBULA_CLOUD'];
const rankedQueue = [];

function startGameLoop(roomId) {
    const room = gameRooms.get(roomId);
    if (!room) return;
    const perkInterval = Math.random() * 2000 + 5000;
    room.gameInterval = setInterval(() => {
        const playerIds = Object.keys(room.players);
        const now = Date.now();
        const cooldown = 4000 + Math.random() * 1000;
        const eligiblePlayers = playerIds.filter(id => !room.players[id].perk && (now - (room.players[id].perkUsedAt || 0) > cooldown));
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
            let user = await User.findOne({ username });
            if (!user) user = await User.create({ username });
            const stats = { wpm: user.averageWPM, accuracy: user.averageAccuracy, gamesPlayed: user.gamesPlayed };
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
            socket.emit('matchmaking_error', { message: 'An error occurred.' });
        }
    });

    socket.on('use_perk', ({ roomId, perk }) => {
        const room = gameRooms.get(roomId);
        const player = room?.players[socket.id];
        if (!player || player.perk !== perk) return;

        player.perk = null;
        player.perkUsedAt = Date.now();
        socket.emit('perk_used');

        // MERGED: Added logic for new perks
        if (perk === 'ASTEROID_ATTACK') {
            socket.to(roomId).emit('asteroid_hit');
        } else if (perk === 'ROCKET_FUEL') {
            const boostLength = Math.floor(room.text.length * 0.15); // Nerfed from 0.25
            const autoCompletedText = room.text.substring(player.progress || 0, (player.progress || 0) + boostLength);
            socket.emit('perk_effect_rocket_fuel', { autoCompletedText });
        } else if (perk === 'REPULSOR_WAVE') {
            socket.to(roomId).emit('repulsor_hit');
        } else if (perk === 'NEBULA_CLOUD') {
            socket.to(roomId).emit('nebula_hit');
        }
    });
    
    // ... rest of socket handlers are largely the same ...
    async function endGame(roomId) {
        const room = gameRooms.get(roomId);
        if (!room) return;
        if (room.suddenDeathTimer) clearTimeout(room.suddenDeathTimer);
        
        for (const playerId in room.players) {
            const player = room.players[playerId];
            if (player.finished) {
                await User.findOneAndUpdate(
                    { username: player.username },
                    { $inc: { gamesPlayed: 1 }, $set: { averageWPM: player.wpm, averageAccuracy: player.accuracy } },
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
        if (!room || !room.players[socket.id]?.finished === false) return;

        const playerState = room.players[socket.id];
        playerState.finished = true;
        playerState.wpm = wpm;
        playerState.accuracy = accuracy;
        
        io.to(roomId).emit('opponent_progress', { playerId: socket.id, progress: 100, wpm: Math.round(wpm), finished: true });

        const playerStates = Object.values(room.players);
        const finishedCount = playerStates.filter(p => p.finished).length;
        const totalPlayers = playerStates.length;

        if (finishedCount === totalPlayers) {
            if (room.suddenDeathTimer) clearTimeout(room.suddenDeathTimer);
            await endGame(roomId);
        } else if (finishedCount === 1 && totalPlayers > 1) {
            const countdownDuration = 15;
            io.to(roomId).emit('suddenDeath', { duration: countdownDuration });
            room.suddenDeathTimer = setTimeout(() => endGame(roomId), countdownDuration * 1000);
        } else if (totalPlayers === 1) {
            await endGame(roomId);
        }
    });

    socket.on('disconnect', () => {
        console.log('user disconnected:', socket.id);
        casualMatchmaking.removeBySocket(socket);
        privateLobby.removePlayerBySocket(socket).forEach(lobby => {
            if (lobby.roomState) io.to(lobby.roomId).emit('lobby_state_update', { roomId: lobby.roomId, ...lobby.roomState });
        });
    });
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server listening on 0.0.0.0:${PORT}`);
});