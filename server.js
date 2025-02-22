// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Chess } = require('chess.js');  // to initialize starting FEN

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the "public" directory
app.use(express.static(__dirname + '/public'));

// Simple in‑memory store for game sessions
const games = {};

io.on('connection', (socket) => {
  console.log('New client connected: ' + socket.id);

  socket.on('createGame', (code) => {
    socket.join(code);
    // Initialize game state with the starting FEN from chess.js
    games[code] = {
      fen: new Chess().fen(),
      players: [socket.id]
    };
    socket.emit('gameCreated', { code, fen: games[code].fen });
    console.log(`Game created with code ${code} by ${socket.id}`);
  });

  socket.on('joinGame', (code) => {
    if (!games[code]) {
      socket.emit('errorMessage', 'Game not found');
      return;
    }
    if (games[code].players.length >= 2) {
      socket.emit('errorMessage', 'Game is full');
      return;
    }
    socket.join(code);
    games[code].players.push(socket.id);
    socket.emit('gameJoined', { code, fen: games[code].fen });
    // Notify the creator that an opponent joined
    socket.to(code).emit('playerJoined');
    console.log(`Player ${socket.id} joined game ${code}`);
  });

  socket.on('move', (data) => {
    const { code, move, fen } = data;
    if (games[code]) {
      // Update the game state on the server
      games[code].fen = fen;
      // Broadcast the move (and new FEN) to all other players in the room
      socket.to(code).emit('move', { move, fen });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected: ' + socket.id);
    // Remove the disconnected player from any game room
    for (const code in games) {
      let game = games[code];
      const index = game.players.indexOf(socket.id);
      if (index !== -1) {
        game.players.splice(index, 1);
        socket.to(code).emit('opponentDisconnected');
        // If no players remain, remove the game
        if (game.players.length === 0) {
          delete games[code];
        }
      }
    }
  });
});

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});
