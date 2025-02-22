const lobby = document.getElementById('lobby');
const gameContainer = document.getElementById('gameContainer');
const createGameBtn = document.getElementById('createGame');
const joinGameBtn = document.getElementById('joinGame');
const gameCodeInput = document.getElementById('gameCode');

let board, game;
let whiteTime = 300, blackTime = 300; // 300 seconds = 5 minutes per side
let timerInterval;

// Function to start the timers
function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    // Check whose turn it is
    if(game.turn() === 'w'){
      whiteTime--;
      document.getElementById('whiteTimer').innerText = formatTime(whiteTime);
    } else {
      blackTime--;
      document.getElementById('blackTimer').innerText = formatTime(blackTime);
    }
    // End game if time runs out
    if(whiteTime <= 0 || blackTime <= 0) {
      clearInterval(timerInterval);
      alert('Time is up!');
    }
  }, 1000);
}

// Helper to format seconds into MM:SS
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${('0' + mins).slice(-2)}:${('0' + secs).slice(-2)}`;
}

// Chessboard move event: restrict moving opponent pieces
function onDragStart(source, piece, position, orientation) {
  if ((game.turn() === 'w' && piece.startsWith('b')) ||
      (game.turn() === 'b' && piece.startsWith('w'))) {
    return false;
  }
}

// Handle piece drops and legal moves
function onDrop(source, target) {
  const move = game.move({
    from: source,
    to: target,
    promotion: 'q' // always promote to a queen for simplicity
  });
  if (move === null) return 'snapback';
}

// Update board position after move animations
function onSnapEnd() {
  board.position(game.fen());
}

// Initialize a new game
function startGame() {
  game = new Chess();
  board = Chessboard('board', {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd
  });
  lobby.style.display = 'none';
  gameContainer.style.display = 'block';
  startTimer();
}

// Generate a random three-digit code
function generateCode() {
  return Math.floor(100 + Math.random() * 900).toString();
}

// Event listeners for lobby buttons
createGameBtn.addEventListener('click', () => {
  const code = generateCode();
  alert('Your game code is: ' + code);
  // In a complete implementation, the code would be sent to a backend server
  // to create and register a new public game session.
  startGame();
});

joinGameBtn.addEventListener('click', () => {
  const code = gameCodeInput.value;
  if (code.length !== 3) {
    alert('Please enter a valid 3-digit code.');
    return;
  }
  // In a complete implementation, the code would be validated with the backend server.
  startGame();
});
