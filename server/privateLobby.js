const { randomUUID } = require('crypto');

const _rooms = new Map();

function _getRoomState(roomId) {
  const room = _rooms.get(roomId);
  if (!room) return null;
  return {
    host: room.host,
    players: Array.from(room.players.values()).map(p => ({
      username: p.username,
      isReady: p.isReady,
    })),
  };
}

function createRoom({ hostUsername, socket }) {
  const roomId = randomUUID().slice(0, 6).toUpperCase();
  const roomData = { host: hostUsername, players: new Map(), sockets: new Map() };
  _rooms.set(roomId, roomData);
  joinRoom({ roomId, username: hostUsername, socket });
  return { roomId, roomState: _getRoomState(roomId) };
}

function joinRoom({ roomId, username, socket }) {
  const room = _rooms.get(roomId);
  if (!room) throw new Error('Lobby not found.');
  if (room.players.has(username)) throw new Error('You are already in this lobby.');
  const playerData = { username, isReady: room.host === username, socket };
  room.players.set(username, playerData);
  room.sockets.set(socket.id, username);
  return { roomState: _getRoomState(roomId) };
}

function setReady(roomId, username, isReady) {
  const room = _rooms.get(roomId);
  if (!room) throw new Error("Lobby not found.");
  const player = room.players.get(username);
  if (!player) throw new Error("Player not found in this lobby.");
  player.isReady = isReady;
  return { roomState: _getRoomState(roomId) };
}

function allReady(roomId) {
  const room = _rooms.get(roomId);
  if (!room || room.players.size < 2) return false;
  return Array.from(room.players.values()).every(p => p.isReady);
}

function removePlayerBySocket(socket) {
  const affectedLobbies = [];
  _rooms.forEach((room, roomId) => {
    if (room.sockets.has(socket.id)) {
      const usernameToRemove = room.sockets.get(socket.id);
      room.players.delete(usernameToRemove);
      room.sockets.delete(socket.id);
      const result = { roomId, username: usernameToRemove };
      if (room.players.size === 0) {
        _rooms.delete(roomId);
        result.roomState = null;
      } else {
        if (room.host === usernameToRemove) {
          room.host = room.players.keys().next().value;
          room.players.get(room.host).isReady = true;
        }
        result.roomState = _getRoomState(roomId);
      }
      affectedLobbies.push(result);
    }
  });
  return affectedLobbies;
}

function getLobbyByRoomId(roomId) {
    return _rooms.get(roomId);
}

module.exports = {
  createRoom,
  joinRoom,
  setReady,
  allReady,
  removePlayerBySocket,
  getLobbyByRoomId, // Export a way to get the full internal room data
};