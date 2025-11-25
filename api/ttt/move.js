// Submit move
// POST /api/ttt/move
// Body: { gameId, playerId, position }
// Response: { board, nextTurn, winner, status, message }

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

function formatBoardForDisplay(board) {
  const displayBoard = [];
  for (let i = 0; i < 9; i++) {
    displayBoard.push(board[i] === null ? (i + 1).toString() : board[i]);
  }
  return displayBoard;
}

function getPlayerSymbol(game, playerId) {
  const player = game.players.find(p => p.id === playerId);
  return player ? player.symbol : null;
}

export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ error: "Method not allowed. Use POST." });
  }

  const { gameId, playerId, position } = req.body || {};
  
  // Validasi input
  if (!gameId || !playerId || position === undefined) {
    return res.status(400).json({ 
      error: "Payload tidak valid. Butuh: gameId, playerId, position (1-9)" 
    });
  }

  const game = games.get(gameId);
  if (!game) {
    return res.status(404).json({ error: "Game tidak ditemukan" });
  }

  if (game.status === "finished") {
    return res.status(400).json({ 
      error: "Game sudah selesai",
      board: formatBoardForDisplay(game.board)
    });
  }

  if (game.status === "waiting") {
    return res.status(400).json({ 
      error: "Game belum dimulai. Menunggu player kedua...",
      board: formatBoardForDisplay(game.board)
    });
  }

  // Validasi player
  const playerSymbol = getPlayerSymbol(game, playerId);
  if (!playerSymbol) {
    return res.status(400).json({ error: "Player tidak terdaftar di game ini" });
  }

  // Validasi turn
  if (game.nextTurn !== playerSymbol) {
    return res.status(400).json({ 
      error: "Bukan giliran kamu", 
      board: formatBoardForDisplay(game.board),
      nextTurn: game.nextTurn
    });
  }

  // Convert position (1-9) to index (0-8)
  const index = parseInt(position) - 1;
  
  // Validasi index
  if (index < 0 || index > 8 || isNaN(index)) {
    return res.status(400).json({ 
      error: "Posisi tidak valid. Gunakan angka 1-9",
      board: formatBoardForDisplay(game.board)
    });
  }

  if (game.board[index] !== null) {
    return res.status(400).json({ 
      error: `Posisi ${position} sudah diisi`,
      board: formatBoardForDisplay(game.board)
    });
  }

  // Apply move
  game.board[index] = playerSymbol;

  const winner = checkWinner(game.board);
  if (winner) {
    game.status = "finished";
    const winnerPlayer = game.players.find(p => p.symbol === winner);
    return res.status(200).json({
      board: formatBoardForDisplay(game.board),
      nextTurn: null,
      winner: winner,
      winnerPlayerId: winnerPlayer?.id,
      status: game.status,
      message: `Player ${winner} (${winnerPlayer?.id}) menang!`
    });
  }

  if (isDraw(game.board)) {
    game.status = "finished";
    return res.status(200).json({
      board: formatBoardForDisplay(game.board),
      nextTurn: null,
      winner: null,
      status: game.status,
      message: "Game seri!"
    });
  }

  // Ganti giliran
  game.nextTurn = playerSymbol === "X" ? "O" : "X";
  const nextPlayer = game.players.find(p => p.symbol === game.nextTurn);
  
  return res.status(200).json({
    board: formatBoardForDisplay(game.board),
    nextTurn: game.nextTurn,
    nextPlayerId: nextPlayer?.id,
    winner: null,
    status: game.status,
    message: `Giliran Player ${game.nextTurn} (${nextPlayer?.id})`
  });
}