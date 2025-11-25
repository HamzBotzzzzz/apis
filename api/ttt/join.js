// Join specific game
// POST /api/ttt/join
// Body: { gameId }
// Response: { gameId, player, board, nextTurn }

const games = (globalThis.__TTT_GAMES__ = globalThis.__TTT_GAMES__ || new Map());

function formatBoardForDisplay(board) {
  const displayBoard = [];
  for (let i = 0; i < 9; i++) {
    displayBoard.push(board[i] === null ? (i + 1).toString() : board[i]);
  }
  return displayBoard;
}

function generatePlayerId(symbol) {
  return `p${symbol === 'X' ? '1' : '2'}_${Math.random().toString(36).slice(2, 6)}`;
}

export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { gameId } = req.body || {};
    
    if (!gameId) {
      return res.status(400).json({ error: "gameId diperlukan" });
    }

    console.log(`Looking for game: ${gameId}`);
    console.log(`Available games:`, Array.from(games.keys()));

    const game = games.get(gameId);
    
    if (!game) {
      return res.status(404).json({ error: "Game tidak ditemukan" });
    }

    if (game.status === "finished") {
      return res.status(400).json({ error: "Game sudah selesai" });
    }

    if (game.players.length >= 2) {
      return res.status(400).json({ error: "Game sudah penuh" });
    }

    let assignedSymbol = "O";
    let playerId = generatePlayerId('O');
    
    // Join sebagai player 2
    game.players.push({ id: playerId, symbol: "O" });
    game.status = "ongoing";
    game.lastActivity = Date.now();

    console.log(`Player 2 joined game ${gameId}`);

    return res.status(200).json({
      gameId: game.id,
      player: assignedSymbol,
      playerId: playerId,
      board: formatBoardForDisplay(game.board),
      nextTurn: game.nextTurn,
      status: game.status,
      players: game.players,
      message: "Bergabung sebagai Player 2 (O). Game dimulai!"
    });
    
  } catch (e) {
    console.error("Error in join game:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
}
