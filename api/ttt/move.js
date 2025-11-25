// Submit move
// POST /api/ttt/move
// Body: { gameId, player, index }
// Response: { board, nextTurn, winner }

const games = (globalThis.__TTT_GAMES__ = globalThis.__TTT_GAMES__ || new Map());

function checkWinner(board) {
  const lines = [
    [0,1,2], [3,4,5], [6,7,8],
    [0,3,6], [1,4,7], [2,5,8],
    [0,4,8], [2,4,6]
  ];
  for (const [a,b,c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

function isDraw(board) {
  return board.every(cell => cell !== null);
}

export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res
      .status(405)
      .end(JSON.stringify({ error: "Method not allowed. Use POST." }));
  }

  const { gameId, player, index } = req.body || {};
  if (!gameId || (player !== "X" && player !== "O") || typeof index !== "number") {
    return res.status(400).end(JSON.stringify({ error: "Invalid payload" }));
  }

  const game = games.get(gameId);
  if (!game) {
    return res.status(404).end(JSON.stringify({ error: "Game not found" }));
  }
  if (game.status === "finished") {
    return res.status(400).end(JSON.stringify({ error: "Game already finished" }));
  }

  // Validate turn
  if (game.nextTurn !== player) {
    return res.status(400).end(JSON.stringify({ error: "Not your turn" }));
  }

  // Validate index
  if (index < 0 || index > 8) {
    return res.status(400).end(JSON.stringify({ error: "Invalid index" }));
  }
  if (game.board[index] !== null) {
    return res.status(400).end(JSON.stringify({ error: "Cell already occupied" }));
  }

  // Apply move
  game.board[index] = player;

  const winner = checkWinner(game.board);
  if (winner) {
    game.status = "finished";
    return res.status(200).end(JSON.stringify({
      board: game.board,
      nextTurn: null,
      winner
    }));
  }

  if (isDraw(game.board)) {
    game.status = "finished";
    return res.status(200).end(JSON.stringify({
      board: game.board,
      nextTurn: null,
      winner: null
    }));
  }

  game.nextTurn = player === "X" ? "O" : "X";
  return res.status(200).end(JSON.stringify({
    board: game.board,
    nextTurn: game.nextTurn,
    winner: null
  }));
}