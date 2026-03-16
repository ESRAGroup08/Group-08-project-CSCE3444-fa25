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
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => console.error('MongoDB connection error:', err));
  
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// --- Daily Challenges Definitions ---
const CHALLENGES = {
  'SPEED_DEMON': { id: 'SPEED_DEMON', description: 'Reach 80 WPM in a single game', reward: 25, target: 80, type: 'wpm' },
  'ACCURACY_MASTER': { id: 'ACCURACY_MASTER', description: 'Achieve 98% accuracy in a game', reward: 30, target: 98, type: 'accuracy' },
  'VICTORY_STREAK': { id: 'VICTORY_STREAK', description: 'Win 2 games in a row', reward: 50, target: 2, type: 'win_streak' },
  'PLAY_THREE': { id: 'PLAY_THREE', description: 'Play 3 games (win or lose)', reward: 15, target: 3, type: 'play_games' }
};

// --- Daily Challenge Helper Functions ---
async function checkAndResetChallenges(user) {
    const now = new Date();
    const lastReset = new Date(user.challengesLastReset);
    const isNewDay = now.setHours(0,0,0,0) > lastReset.setHours(0,0,0,0);

    if (isNewDay) {
        user.dailyChallenges = Object.values(CHALLENGES).map(c => ({
            challengeId: c.id,
            description: c.description,
            reward: c.reward,
            progress: 0,
            target: c.target,
            completed: false
        }));
        user.challengesLastReset = new Date();
        await user.save();
        console.log(`Reset daily challenges for ${user.username}`);
    }
    return user;
}

/* --- USER & PROFILE API ROUTES --- */
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

app.get('/api/users/:username', async (req, res) => {
    try {
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
        res.json({ message: 'Username updated successfully!', username: user.username });
    } catch (error) {
        res.status(500).json({ message: 'Server error while updating username.' });
    }
});

/* --- FRIENDS API ROUTES --- */
app.get('/api/users/search', async (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: 'Search query is required.' });
    try {
        const users = await User.find({ username: { $regex: query, $options: 'i' } }).limit(10);
        res.json(users.map(u => ({ _id: u._id, username: u.username })));
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

app.post('/api/friend-request/send', async (req, res) => {
    const senderUsername = req.headers['x-username'];
    const { recipientId } = req.body;
    try {
        const sender = await User.findOne({ username: senderUsername });
        const recipient = await User.findById(recipientId);
        if (!sender || !recipient) return res.status(404).json({ message: 'User not found.' });
        if (sender._id.equals(recipient._id)) return res.status(400).json({ message: 'You cannot add yourself.' });

        await User.findByIdAndUpdate(sender._id, { $addToSet: { friendRequestsSent: recipient._id } });
        await User.findByIdAndUpdate(recipient._id, { $addToSet: { friendRequestsReceived: sender._id } });
        res.status(200).json({ message: 'Friend request sent.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error sending request.' });
    }
});

app.post('/api/friend-request/accept', async (req, res) => {
    const acceptorUsername = req.headers['x-username'];
    const { senderId } = req.body;
    try {
        const acceptor = await User.findOne({ username: acceptorUsername });
        const sender = await User.findById(senderId);
        if (!acceptor || !sender) return res.status(404).json({ message: 'User not found.' });

        await User.findByIdAndUpdate(acceptor._id, {
            $addToSet: { friends: sender._id },
            $pull: { friendRequestsReceived: sender._id }
        });
        await User.findByIdAndUpdate(sender._id, {
            $addToSet: { friends: acceptor._id },
            $pull: { friendRequestsSent: acceptor._id }
        });
        res.status(200).json({ message: 'Friend request accepted.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error accepting request.' });
    }
});

app.post('/api/friend-request/reject', async (req, res) => {
    const currentUserUsername = req.headers['x-username'];
    const { otherUserId } = req.body;
    try {
        const currentUser = await User.findOne({ username: currentUserUsername });
        const otherUser = await User.findById(otherUserId);
        if (!currentUser || !otherUser) return res.status(404).json({ message: 'User not found.' });

        await User.findByIdAndUpdate(currentUser._id, { $pull: { friendRequestsReceived: otherUser._id, friendRequestsSent: otherUser._id } });
        await User.findByIdAndUpdate(otherUser._id, { $pull: { friendRequestsSent: currentUser._id, friendRequestsReceived: currentUser._id } });
        res.status(200).json({ message: 'Request rejected or cancelled.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error rejecting request.' });
    }
});

app.post('/api/friend/remove', async (req, res) => {
    const currentUserUsername = req.headers['x-username'];
    const { friendIdToRemove } = req.body;
    try {
        const currentUser = await User.findOne({ username: currentUserUsername });
        await User.findByIdAndUpdate(currentUser._id, { $pull: { friends: friendIdToRemove } });
        await User.findByIdAndUpdate(friendIdToRemove, { $pull: { friends: currentUser._id } });
        res.status(200).json({ message: 'Friend removed.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error removing friend.' });
    }
});

app.get('/api/leaderboard', async (req, res) => {
    try {
        const topPlayers = await User.find({})
            .sort({ rating: -1 }) // Sort by rating, highest first
            .limit(25)            // Limit to top 25
            .select('username rating gamesPlayed'); // Select only needed fields

        res.json(topPlayers);
    } catch (error) {
        console.error('Error fetching leaderboard data:', error);
        res.status(500).json({ message: 'Server error while fetching leaderboard.' });
    }
});

// NEW: API Endpoint for Daily Challenges
app.get('/api/challenges', async (req, res) => {
    const username = req.headers['x-username'];
    if (!username) return res.status(401).json({ message: 'Unauthorized' });

    try {
        let user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: 'User not found' });

        user = await checkAndResetChallenges(user);

        res.json({
            dailyChallenges: user.dailyChallenges,
            challengesLastReset: user.challengesLastReset
        });
    } catch (error) {
        console.error("Error fetching challenges:", error);
        res.status(500).json({ message: 'Server error fetching challenges.' });
    }
});

const gameRooms = new Map();
const rankedQueue = [];
const TEXT_SNIPPETS = [
    "The diplomatic envoy from the Zorgon Hegemony arrived in a ship that looked more like a work of art than a vessel of war. Its hull shimmered with organic bioluminescence, pulsing in rhythm with their language. We stood ready at the airlock, hoping that this meeting would end the century-long conflict between our systems.",
    "Solar flares can disrupt shielding and fry sensitive electronics in an instant. The captain ordered all non-essential systems powered down as the wave of charged particles washed over the ship. Sparks flew from the control panels, and the artificial gravity fluctuated wildly, sending tools and coffee cups floating through the bridge.",
    "Exploring the oceanic moon of Enceladus required a specialized submersible capable of withstanding crushing pressure. We descended through the cracks in the ice shell, entering a dark, subterranean ocean heated by hydrothermal vents. There, in the eternal gloom, we found life forms that defied all biological classification.",
    "The nebula was a dense cloud of ionized gas and dust, blocking our long-range sensors. Flying through it was like navigating a thick fog, forcing us to rely on visual piloting. Lightning arc'd between the gas clouds, illuminating the silhouette of a massive structure hiding deep within the stellar nursery.",
    "Warp drive instability is the nightmare of every starship engineer. The containment field fluctuated dangerously, threatening to collapse the antimatter bubble. Sweat dripped down the chief engineer's face as she manually recalibrated the magnetic injectors, praying that the containment field would hold for just a few more minutes.",
    "The ancient ruins on Proxima B were built by a civilization that vanished long before humanity discovered fire. Towering monoliths of black stone hummed with a low resonance, reacting to our presence. We touched the glyphs carved into the surface, and suddenly, the entire city began to light up.",
    "Space debris is a growing problem in the orbital lanes of industrialized planets. A paint fleck traveling at orbital velocity hits with the force of a bullet. Our cleanup crews use magnetic nets and laser ablation to clear the path for civilian transports, a thankless but vital job for keeping the trade routes open.",
    "The holographic AI flickered as it processed the complex calculations for the jump coordinates. 'Probability of survival is approximately 72 percent,' it stated in a calm, synthetic voice. The captain grinned and pushed the throttle forward, betting everything on that 72 percent chance to escape the pursuing cruiser.",
    "Living in zero gravity changes the human body in strange ways. Bones lose density and muscles atrophy without strict exercise regimens. Yet, floating freely through the corridors of the station brings a sense of freedom that surface-dwellers will never understand, a permanent detachment from the weight of the world."
];

// --- Helper Functions ---
function getCleanRoomState(room) {
    if (!room) return null;
    const now = Date.now();
    return {
        roomId: room.roomId,
        players: room.players,
        text: room.text,
        status: room.status,
        isRanked: room.isRanked,
        // Send specific durations remaining for each phase
        waitingTimeLeft: room.waitingEndTime ? Math.max(0, room.waitingEndTime - now) : null,
        countdownTimeLeft: room.countdownEndTime ? Math.max(0, room.countdownEndTime - now) : null,
        suddenDeathTimeLeft: room.suddenDeathEndTime ? Math.max(0, room.suddenDeathEndTime - now) : null
    };
}

function endGame(roomId) {
    const room = gameRooms.get(roomId);
    if (!room || room.status === 'finished') return;

    console.log(`Room ${roomId}: Ending game.`);
    if (room.timerId) clearTimeout(room.timerId);
    
    room.status = 'finished';

    // Find winner by progress
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
    
    console.log(`Room ${roomId}: Starting 3s countdown.`);
    room.status = 'countdown';
    room.countdownEndTime = Date.now() + 3000;
    
    io.to(roomId).emit('room_state', getCleanRoomState(room));

    setTimeout(() => {
        const r = gameRooms.get(roomId);
        if (!r) return;
        r.status = 'playing';
        io.to(roomId).emit('room_state', getCleanRoomState(r));
    }, 3000);
}

// --- MODIFIED: Create and start a game from two matched players ---
function createAndStartGame(player1, player2, isRanked = false) {
    const roomId = randomUUID().slice(0, 8); // Game room ID
    const text = TEXT_SNIPPETS[Math.floor(Math.random() * TEXT_SNIPPETS.length)];

    const room = {
        roomId,
        text,
        players: {},
        status: 'waiting', // Will quickly transition to 'found'
        isRanked,
        isPrivate: false,
        timerId: null,
    };
    
    // Add players to room
    room.players[player1.socket.id] = { username: player1.username, progress: 0, wpm: 0, finished: false, perk: null, perkUsed: false };
    room.players[player2.socket.id] = { username: player2.username, progress: 0, wpm: 0, finished: false, perk: null, perkUsed: false };

    gameRooms.set(roomId, room);

    // Notify both players they have a match and join them to the Socket.IO room
    player1.socket.join(roomId);
    player2.socket.join(roomId);

    // Send the initial game state to both players
    io.to(roomId).emit('match_found', getCleanRoomState(room));
    
    console.log(`[Game] Match found! Room ${roomId} created for ${player1.username} and ${player2.username}.`);

    // The game will wait for players to select perks on the client,
    // which then triggers the 'player_ready' event and starts the countdown.
}


io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // --- REVISED: Casual matchmaking using the dedicated module ---
    socket.on('join_casual', async ({ username }) => {
        try {
            const user = await User.findOne({ username });
            const stats = {
                wpm: user ? user.averageWPM : 0,
                accuracy: user ? user.averageAccuracy : 0,
                gamesPlayed: user ? user.gamesPlayed : 0,
            };

            // The enqueue function is now async
            const result = await casualMatchmaking.enqueue({
                socket,
                username,
                stats, // stats are no longer used in the new module, but we can keep it for now
                skillScore: ranking.computeSkillScore(stats)
            });

            if (result.matched) {
                // A match was found immediately
                // We need to find the socket objects for the matched players
                const selfSocket = io.sockets.sockets.get(result.self.socketId);
                const opponentSocket = io.sockets.sockets.get(result.opponent.socketId);

                if (selfSocket && opponentSocket) {
                    createAndStartGame(
                        { socket: selfSocket, username: result.self.username }, 
                        { socket: opponentSocket, username: result.opponent.username }, 
                        false
                    );
                } else {
                    // One of the players disconnected in the tiny window between matching and starting the game.
                    // We should put the remaining player back in the queue if they are still connected.
                    console.log("[MM] A matched player disconnected before game could start.");
                    if (selfSocket) {
                        // Re-queue self
                        socket.emit('matchmaking_error', { message: 'Your opponent disconnected. Finding a new match...' });
                        // You could call enqueue again here for the remaining player
                    }
                }
            } else {
                // No match, player is now in the queue
                socket.emit('waiting_for_match');
                console.log(`[MM] ${username} is waiting for a casual match.`);
            }
        } catch (error) {
            console.error('[MM] Error in casual matchmaking:', error);
            socket.emit('matchmaking_error', { message: 'An error occurred while finding a match.' });
        }
    });
    
    socket.on('join_ranked', ({ username }) => {
        // NOTE: The logic for ranked matchmaking can be improved similarly.
        // For now, we leave the old logic in place for ranked.
        joinGame(username, true)
    });


    // --- This is the OLD matchmaking logic, we will keep it for ranked for now ---
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
            waitingEndTime: null,
            countdownEndTime: null,
            suddenDeathEndTime: null,
            timerId: null
        };

        if (!foundRoom) {
            gameRooms.set(roomId, room);
            room.waitingEndTime = Date.now() + 10000;
            room.timerId = setTimeout(() => startCountdown(roomId), 10000);
        }

        room.players[socket.id] = { username, progress: 0, typedLength: 0, progressModifier: 0, wpm: 0, finished: false, perk: null, perkUsed: false };
        socket.join(roomId);

        socket.emit('match_found', getCleanRoomState(room));
        io.to(roomId).emit('room_state', getCleanRoomState(room));

        if (Object.keys(room.players).length === 4) {
             if (room.timerId) clearTimeout(room.timerId);
             startCountdown(roomId);
        }
    };

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
                players[p.socket.id] = { username: p.username, progress: 0, typedLength: 0, progressModifier: 0, wpm: 0, finished: false, perk: null, perkUsed: false };
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
            // startCountdown(roomId); // REMOVED: Wait for players to select perks
            io.to(roomId).emit('match_found', getCleanRoomState(room));

        } catch (error) {
            console.error("Start Game Error:", error);
        }
    });

    socket.on('join_specific_room', ({ roomId, username }) => {
        const room = gameRooms.get(roomId);
        if (room) {
            if (!room.players[socket.id]) {
                 room.players[socket.id] = { username, progress: 0, typedLength: 0, progressModifier: 0, wpm: 0, finished: false, perk: null, perkUsed: false };
                 socket.join(roomId);
            }
            socket.emit('room_state', getCleanRoomState(room));
            io.to(roomId).emit('players_update', room.players);
        } else {
            socket.emit('error', { message: 'Room not found' });
        }
    });

    socket.on('player_ready', ({ roomId, perk }) => {
        const room = gameRooms.get(roomId);
        if (room && room.players[socket.id]) {
            room.players[socket.id].perk = perk;
        }

        // For all match types, check if all players are ready to start
        if (room) {
            const allPlayersReady = Object.values(room.players).every(p => p.perk);
            if (allPlayersReady) {
                startCountdown(roomId);
            }
        }
    });

    socket.on('activate_perk', ({ roomId, perkName }) => {
        const room = gameRooms.get(roomId);
        if (!room || !room.players[socket.id] || room.players[socket.id].perkUsed) return;

        room.players[socket.id].perkUsed = true;
        const opponents = Object.keys(room.players).filter(id => id !== socket.id);
        const randomOpponentId = opponents[Math.floor(Math.random() * opponents.length)];
        // const textLen = room.text.length; // Unused now

        switch (perkName) {
            case 'Solar Flare':
                if (randomOpponentId) {
                    io.to(roomId).emit('perk_effect', { perkName, targetPlayerId: randomOpponentId });
                }
                break;
            case 'Hyperdrive':
                io.to(roomId).emit('perk_effect', { perkName, targetPlayerId: socket.id });
                break;
            case 'Tractor Beam':
                if (randomOpponentId) {
                    io.to(roomId).emit('perk_effect', { perkName, targetPlayerId: randomOpponentId });
                }
                break;
            case 'System Hack':
                if (randomOpponentId) {
                    io.to(roomId).emit('perk_effect', { perkName, targetPlayerId: randomOpponentId });
                }
                break;
        }
    });

    socket.on('player_progress', ({ roomId, typedLength, wpm }) => {
        const room = gameRooms.get(roomId);
        if (!room) return;
        
        // Strict status check to prevent premature playing
        if (room.status !== 'playing' && room.status !== 'sudden_death') return;
        
        if (!room.players[socket.id]) return;

        const p = room.players[socket.id];
        p.typedLength = typedLength || 0;
        p.wpm = wpm;
        
        const textLen = room.text.length;
        p.progress = Math.min(100, Math.max(0, (p.typedLength / textLen * 100) + p.progressModifier));
        
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

    socket.on('disconnect', async () => {
        // --- ADDED: Remove player from casual matchmaking queue on disconnect ---
        //casualMatchmaking.removeBySocket(socket);
        await casualMatchmaking.removeBySocketId(socket.id);
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