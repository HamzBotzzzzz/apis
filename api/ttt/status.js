// Get game status
// GET /api/ttt/status?gameId=xxx
// Response: { board, nextTurn, winner, status, players }

const games = (globalThis.__TTT_GAMES__ = globalThis.__TTT_GAMES__ || new Map());

function formatBoardForDisplay(board) {
  const displayBoard = [];
  for (let i = 0; i < 9; i++) {
    displayBoard.push(board[i] === null ? (i + 1).toString() : board[i]);
  }
  return displayBoard;
}

export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ error: "Method not allowed. Use GET." });
  }

  const { gameId } = req.query;
  
  if (!gameId) {
    return res.status(400).json({ 
      error: "Parameter gameId diperlukan" 
    });
  }

  const game = games.get(gameId);
  if (!game) {
    return res.status(404).json({ error: "Game tidak ditemukan" });
  }

  const winner = checkWinner(game.board);
  
  return res.status(200).json({
    gameId: game.id,
    board: formatBoardForDisplay(game.board),
    nextTurn: game.nextTurn,
    winner: winner,
    status: game.status,
    players: game.players,
    message: getStatusMessage(game, winner)
  });
}

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

function getStatusMessage(game, winner) {
  if (winner) {
    return `Game selesai! Player ${winner} menang!`;
  }
  if (game.status === "finished") {
    return "Game seri!";
  }
  if (game.status === "waiting") {
    return "Menunggu player kedua...";
  }
  return `Giliran Player ${game.nextTurn}`;
}