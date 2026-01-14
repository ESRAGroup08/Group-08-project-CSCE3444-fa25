const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const { randomUUID } = require('crypto');

const privateLobby = require('./privateLobby');
const User = require('./models/User');

// --- Register User model ---
mongoose.model('User');

const app = express();
const server = http.createServer(app);

// --- CORS Configuration ---
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://group-08-project-csce3444-fa25.onrender.com",
  "https://group-08-multi-feat-preview.onrender.com",
  "https://galactic-typing.onrender.com"
];

const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ["GET", "POST"] },
  transports: ['polling', 'websocket'],
});

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://game_user:testuser123@gltp0.tez957z.mongodb.net/?appName=GLTP0')
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => console.error('MongoDB connection error:', err));
  
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

const gameRooms = new Map();
const rankedQueue = [];
const TEXT_SNIPPETS = [
    'The cosmos is vast and full of wonders, from shimmering nebulas to swirling galaxies.',
    'A lone spaceship drifted through the asteroid field, its pilot expertly dodging the floating rocks.',
    'Quantum mechanics is the theoretical basis of modern physics that explains the nature and behavior of matter and energy on the atomic and subatomic level.',
];

// --- Helper Functions ---
function getCleanRoomState(room) {
    if (!room) return null;
    return {
        roomId: room.roomId,
        players: room.players,
        text: room.text,
        status: room.status,
        lobbyEndTime: room.lobbyEndTime,
        suddenDeathEndTime: room.suddenDeathEndTime,
        isRanked: room.isRanked,
        serverTime: Date.now() // Send server's current time for clock sync
    };
}

function endGame(roomId) {
    const room = gameRooms.get(roomId);
    if (!room || room.status === 'finished') return;

    console.log(`Room ${roomId}: Ending game.`);
    if (room.timerId) clearTimeout(room.timerId);
    
    room.status = 'finished';

    // Find winner by progress (if multiple at 100%, first finished is winner)
    const playersArr = Object.entries(room.players).map(([id, p]) => ({ ...p, id }));
    const winner = playersArr.sort((a, b) => {
        if (a.finished && !b.finished) return -1;
        if (!a.finished && b.finished) return 1;
        return b.progress - a.progress;
    })[0];

    io.to(roomId).emit('game_over', { 
        players: room.players,
        winnerId: winner ? winner.id : null
    });
    
    setTimeout(() => gameRooms.delete(roomId), 300000);
}

function startCountdown(roomId) {
    const room = gameRooms.get(roomId);
    if (!room) return;
    
    console.log(`Room ${roomId}: Starting countdown.`);
    room.status = 'countdown';
    room.lobbyEndTime = Date.now() + 3000;
    
    io.to(roomId).emit('room_state', getCleanRoomState(room));

    setTimeout(() => {
        const r = gameRooms.get(roomId);
        if (!r) return;
        console.log(`Room ${roomId}: Game Started!`);
        r.status = 'playing';
        r.lobbyEndTime = null;
        io.to(roomId).emit('room_state', getCleanRoomState(r));
    }, 3000);
}

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    const joinGame = (username, isRanked) => {
        let foundRoom = null;
        for (const [id, r] of gameRooms) {
            if (Object.keys(r.players).length < 4 && r.status === 'waiting' && r.isRanked === isRanked) {
                foundRoom = r;
                break;
            }
        }

        const roomId = foundRoom ? foundRoom.roomId : randomUUID();
        const room = foundRoom || {
            roomId,
            text: TEXT_SNIPPETS[Math.floor(Math.random() * TEXT_SNIPPETS.length)],
            players: {},
            status: 'waiting',
            isRanked,
            lobbyEndTime: null,
            timerId: null,
            suddenDeathEndTime: null
        };

        if (!foundRoom) {
            console.log(`Matchmaking: Creating new ${isRanked ? 'Ranked' : 'Casual'} room ${roomId}`);
            gameRooms.set(roomId, room);
            console.log(`Room ${roomId}: First player joined. Starting 10s timer.`);
            room.lobbyEndTime = Date.now() + 10000;
            room.timerId = setTimeout(() => startCountdown(roomId), 10000);
        }

        room.players[socket.id] = { username, progress: 0, wpm: 0, finished: false };
        socket.join(roomId);
        console.log(`User ${username} joined room ${roomId}`);

        socket.emit('match_found', getCleanRoomState(room));
        io.to(roomId).emit('room_state', getCleanRoomState(room));

        if (Object.keys(room.players).length === 4) {
             console.log(`Room ${roomId}: Room full. Starting countdown immediately.`);
             if (room.timerId) clearTimeout(room.timerId);
             startCountdown(roomId);
        }
    };

    socket.on('join_casual', ({ username }) => joinGame(username, false));
    socket.on('join_ranked', ({ username }) => joinGame(username, true));

    // --- CUSTOM LOBBY (Private) ---
    socket.on('create_private_lobby', ({ username }) => {
        const lobby = privateLobby.createRoom({ hostUsername: username, socket });
        socket.join(lobby.roomId);
        socket.emit('private_lobby_created', { roomId: lobby.roomId, roomState: lobby.roomState });
    });

    socket.on('join_private_lobby', ({ roomId, username }) => {
        try {
            const lobbyState = privateLobby.joinRoom({ roomId, username, socket });
            socket.join(roomId);
            io.to(roomId).emit('lobby_state_update', { roomId, ...lobbyState.roomState });
        } catch (error) {
            socket.emit('lobby_error', { message: error.message });
        }
    });

    socket.on('set_private_ready', ({ roomId, username, isReady }) => {
        try {
            const lobbyState = privateLobby.setReady(roomId, username, isReady);
            io.to(roomId).emit('lobby_state_update', { roomId, ...lobbyState.roomState });
        } catch (error) {
            console.error("Set Ready Error:", error.message);
        }
    });
    
    socket.on('start_private_game', ({ roomId, username }) => {
        try {
            const lobby = privateLobby.getLobbyByRoomId(roomId);
            if (!lobby || lobby.host !== username) return;
            // if (!privateLobby.allReady(roomId)) return; // Optional check

            const text = TEXT_SNIPPETS[Math.floor(Math.random() * TEXT_SNIPPETS.length)];
            const players = {};
            lobby.players.forEach(p => {
                players[p.socket.id] = { username: p.username, progress: 0, wpm: 0, finished: false };
            });

            const room = {
                roomId,
                text,
                players,
                status: 'waiting',
                isRanked: false,
                isPrivate: true,
                lobbyEndTime: null,
                timerId: null,
                suddenDeathEndTime: null
            };
            
            gameRooms.set(roomId, room);
            startCountdown(roomId);
            io.to(roomId).emit('match_found', getCleanRoomState(room));

        } catch (error) {
            console.error("Start Game Error:", error);
        }
    });

    socket.on('join_specific_room', ({ roomId, username }) => {
        const room = gameRooms.get(roomId);
        if (room) {
            if (!room.players[socket.id]) {
                 room.players[socket.id] = { username, progress: 0, wpm: 0, finished: false };
                 socket.join(roomId);
            }
            socket.emit('room_state', getCleanRoomState(room));
            io.to(roomId).emit('players_update', room.players);
        } else {
            socket.emit('error', { message: 'Room not found' });
        }
    });

    socket.on('player_progress', ({ roomId, progress, wpm }) => {
        const room = gameRooms.get(roomId);
        if (!room || (room.status !== 'playing' && room.status !== 'sudden_death')) return;
        if (!room.players[socket.id]) return;

        room.players[socket.id].progress = progress;
        room.players[socket.id].wpm = wpm;
        io.to(roomId).emit('players_update', room.players);
    });

    socket.on('player_finished', ({ roomId, wpm }) => {
        const room = gameRooms.get(roomId);
        if (!room || !room.players[socket.id]) return;

        room.players[socket.id].finished = true;
        room.players[socket.id].progress = 100;
        room.players[socket.id].wpm = wpm;
        
        io.to(roomId).emit('players_update', room.players);

        const finishers = Object.values(room.players).filter(p => p.finished).length;
        const total = Object.keys(room.players).length;

        if (finishers === 1 && total > 1) {
            console.log(`Room ${roomId}: Sudden Death triggered!`);
            room.status = 'sudden_death';
            room.suddenDeathEndTime = Date.now() + 10000;
            if (room.timerId) clearTimeout(room.timerId);
            
            io.to(roomId).emit('room_state', getCleanRoomState(room));
            room.timerId = setTimeout(() => {
                console.log(`Room ${roomId}: Sudden Death expired.`);
                endGame(roomId);
            }, 10000);
        } else if (finishers === total || total === 1) {
            endGame(roomId);
        }
    });

    socket.on('disconnect', () => {
        const updates = privateLobby.removePlayerBySocket(socket);
        updates.forEach(({ roomId, roomState }) => {
            if (roomState) io.to(roomId).emit('lobby_state_update', { roomId, ...roomState });
        });

        const idx = rankedQueue.findIndex(p => p.socket.id === socket.id);
        if (idx !== -1) rankedQueue.splice(idx, 1);

        gameRooms.forEach((room, rId) => {
            if (room.players[socket.id]) {
                delete room.players[socket.id];
                if (Object.keys(room.players).length === 0) gameRooms.delete(rId);
                else io.to(rId).emit('players_update', room.players);
            }
        });
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server listening on 0.0.0.0:${PORT}`));