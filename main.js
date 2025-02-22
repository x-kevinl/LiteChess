// main.js

const socket = io();

const lobby = document.getElementById('lobby');
const gameContainer = document.getElementById('gameContainer');
const createGameBtn = document.getElementById('createGame');
const joinGameBtn = document.getElementById('joinGame');
const gameCodeInput = document.getElementById('gameCode');

let board, game;
let gameCode = '';
let playerColor = ''; // 'w' for white, 'b' for black
let whiteTime = 300, blackTime = 300; // 5 minutes per side (in seconds)
let timerInterval;

// Timer functions
function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    // Decrease time for the side whose turn it is
    if (game.turn() === 'w') {
      whiteTime--;
      document.getElementById('whiteTimer').innerText = formatTime(whiteTime);
    } else {
      blackTime--;
      document.getElementById('blackTimer').innerText = formatTime(blackTime);
    }
    if (whiteTime <= 0 || blackTime <= 0) {
      clearInterval(timerInterval);
      alert('Time is up!');
    }
  }, 1000);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${('0' + mins).slice(-2)}:${('0' + secs).slice(-2)}`;
}

// Only allow dragging if it's the player's turn and they own the piece.
function onDragStart(source, piece, position, orientation) {
  if (game.turn() !== playerColor) return false;
  if ((playerColor === 'w' && piece.charAt(0) !== 'w') ||
      (playerColor === 'b' && piece.charAt(0) !== 'b')) {
    return false;
  }
}

function onDrop(source, target) {
  let move = game.move({
    from: source,
    to: target,
    promotion: 'q' // always promote to queen for simplicity
  });
  if (move === null) return 'snapback';
  board.position(game.fen());
  // Emit move event to the server along with the updated FEN
  socket.emit('move', { code: gameCode, move: move.san, fen: game.fen() });
}

function onSnapEnd() {
  board.position(game.fen());
}

// Initialize the game with a given FEN (or start position)
function startGame(initialFen) {
  game = new Chess(initialFen || 'start');
  board = Chessboard('board', {
    draggable: true,
    position: game.fen(),
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd
  });
  lobby.style.display = 'none';
  gameContainer.style.display = 'block';
  startTimer();
}

// Generate a random three-digit game code
function generateCode() {
  return Math.floor(100 + Math.random() * 900).toString();
}

// Lobby button event listeners
createGameBtn.addEventListener('click', () => {
  gameCode = generateCode();
  alert('Your game code is: ' + gameCode);
  socket.emit('createGame', gameCode);
});

joinGameBtn.addEventListener('click', () => {
  const code = gameCodeInput.value;
  if (code.length !== 3) {
    alert('Please enter a valid 3-digit code.');
    return;
  }
  gameCode = code;
  socket.emit('joinGame', gameCode);
});

// Socket event handlers
socket.on('gameCreated', (data) => {
  playerColor = 'w'; // The creator is white
  startGame(data.fen);
});

socket.on('gameJoined', (data) => {
  playerColor = 'b'; // The joiner is black
  startGame(data.fen);
});

socket.on('playerJoined', () => {
  console.log('An opponent has joined your game.');
});

socket.on('move', (data) => {
  // Update the game state when receiving an opponent’s move
  if (game.fen() !== data.fen) {
    game.load(data.fen);
    board.position(data.fen);
  }
});

socket.on('errorMessage', (msg) => {
  alert(msg);
});

socket.on('opponentDisconnected', () => {
  alert('Your opponent has disconnected.');
});
