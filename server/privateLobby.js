
// privateLobby.js
// FR-09: Private Match Lobby manager
//
// Responsibilities:
// - create / join / leave private rooms (2+ players)
// - track players, readiness, and simple room metadata
// - validate actions (only room members can ready/leave/start)
// - emit room state via callbacks supplied by the server (no direct socket.io dependency)
// - small in-memory implementation intended for easy replacement with DB-backed storage
//
// Usage pattern (server):
// const privateLobby = require('./privateLobby');
// // create room (server side)
// const room = privateLobby.createRoom({ roomId, hostUsername, socket, stats });
// // join room
// privateLobby.joinRoom({ roomId, username, socket, stats });
// // set ready
// privateLobby.setReady(roomId, username, true);
// // check allReady(roomId) -> if true, start the private game
// // when starting, server will call startRoom(roomId) to obtain the player list & initial payload
//
// Callbacks:
// The module does not call socket.emit itself. Instead it returns room state and helper data.
// This keeps the module testable and backend-framework-agnostic.

const { randomBytes } = require("crypto");

const rooms = new Map(); // Map<roomId, { host, players: Map<username, { socket, ready, stats }>, createdAt }>

function makeRoomId(len = 8) {
  return randomBytes(Math.ceil(len / 2)).toString("hex").slice(0, len);
}

// --- Helpers ---
function ensureRoomExists(roomId) {
  if (!rooms.has(roomId)) throw new Error("Room not found");
  return rooms.get(roomId);
}

function playerListFor(room) {
  // return array of { username, ready, stats }
  return Array.from(room.players.entries()).map(([username, info]) => ({
    username,
    ready: !!info.ready,
    stats: info.stats || {},
  }));
}

// --- Public API ---

// createRoom({ roomId, hostUsername, socket, stats })
// if roomId is false, a random id is generated
// throws if roomId already exists
function createRoom({ roomId = null, hostUsername, socket, stats = {} } = {}) {
  if (!hostUsername || !socket) throw new Error("createRoom requires hostUsername and socket");
  const rid = roomId || makeRoomId(8);
  if (rooms.has(rid)) throw new Error("Room already exists");
  const players = new Map();
  players.set(hostUsername, { socket, ready: false, stats });
  const room = { host: hostUsername, players, createdAt: Date.now() };
  rooms.set(rid, room);
  return { roomId: rid, roomState: { host: room.host, players: playerListFor(room) } };
}

// joinRoom({ roomId, username, socket, stats })
// throws if room not found or username already in room
function joinRoom({ roomId, username, socket, stats = {} } = {}) {
  if (!roomId || !username || !socket) throw new Error("joinRoom requires roomId, username and socket");
  const room = ensureRoomExists(roomId);
  if (room.players.has(username)) throw new Error("Username already in room");
  room.players.set(username, { socket, ready: false, stats });
  return { roomId, roomState: { host: room.host, players: playerListFor(room) } };
}

// leaveRoom(roomId, username)
// removes player; if room empty deletes room; if host leaves reassigns host
// returns new room state (or null if room deleted)
function leaveRoom(roomId, username) {
  if (!roomId || !username) throw new Error("leaveRoom requires roomId and username");
  const room = rooms.get(roomId);
  if (!room) return null;
  room.players.delete(username);
  if (room.players.size === 0) {
    rooms.delete(roomId);
    return null;
  }
  if (room.host === username) {
    // pick new host (first key)
    room.host = room.players.keys().next().value;
  }
  return { roomId, roomState: { host: room.host, players: playerListFor(room) } };
}

// setReady(roomId, username, ready)
// marks player's ready state; throws if invalid
function setReady(roomId, username, ready) {
  const room = ensureRoomExists(roomId);
  const p = room.players.get(username);
  if (!p) throw new Error("Player not in room");
  p.ready = !!ready;
  return { roomId, roomState: { host: room.host, players: playerListFor(room) } };
}

// allReady(roomId) -> boolean
function allReady(roomId) {
  const room = rooms.get(roomId);
  if (!room) return false;
  for (const [, p] of room.players) {
    if (!p.ready) return false;
  }
  return true;
}

// getRoomState(roomId) -> { roomId, host, players: [...] } or null
function getRoomState(roomId) {
  const room = rooms.get(roomId);
  if (!room) return null;
  return { roomId, host: room.host, players: playerListFor(room) };
}

// startRoom(roomId)
// intended to be called by server once allReady(roomId) is true (or host forces start).
// returns match info: { roomId, players: [{ username, stats }], startedAt }
// does NOT remove the room unless you decide so; caller can remove room after starting if desired
function startRoom(roomId) {
  const room = ensureRoomExists(roomId);
  const playersArr = playerListFor(room).map((p) => ({ username: p.username, stats: p.stats }));
  const startedAt = Date.now();
  return { roomId, players: playersArr, startedAt };
}

// removePlayerBySocket(socket)
// convenience to remove a player's presence when their socket disconnects
// returns list of rooms affected with their new states (or null if deleted)
function removePlayerBySocket(socket) {
  const affected = [];
  for (const [rid, room] of rooms.entries()) {
    for (const [username, info] of room.players.entries()) {
      if (info.socket === socket) {
        const newState = leaveRoom(rid, username); // handles deletion / host reassignment
        affected.push({ roomId: rid, roomState: newState ? newState.roomState : null, username });
        break; // move to next room
      }
    }
  }
  return affected;
}

// listRooms() - diagnostic: returns array of { roomId, host, playersCount, createdAt }
function listRooms() {
  const out = [];
  for (const [rid, room] of rooms.entries()) {
    out.push({ roomId: rid, host: room.host, playersCount: room.players.size, createdAt: room.createdAt });
  }
  return out;
}

// clearAll() - admin/testing helper
function clearAll() {
  rooms.clear();
}

module.exports = {
  createRoom,
  joinRoom,
  leaveRoom,
  setReady,
  allReady,
  getRoomState,
  startRoom,
  removePlayerBySocket,
  listRooms,
  clearAll,
  // expose internal map for diagnostics/tests (read-only recommended)
  _rooms: rooms,
};