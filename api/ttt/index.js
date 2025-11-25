// Create/join game (multiplayer)
// POST /api/ttt
// Response: { gameId, player, board, nextTurn, status }

const games = (globalThis.__TTT_GAMES__ = globalThis.__TTT_GAMES__ || new Map());

function createGame() {
  const gameId = Math.random().toString(36).slice(2, 10);
  const board = Array(9).fill(null);
  const game = {
    id: gameId,
    board,
    players: [], // [{ id, symbol: "X"|"O" }]
    nextTurn: "X",
    status: "waiting", // "waiting" | "ongoing" | "finished"
    createdAt: Date.now()
  };
  games.set(gameId, game);
  
  // Clean up old games (older than 1 hour)
  cleanupOldGames();
  
  return game;
}

function cleanupOldGames() {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  for (const [gameId, game] of games.entries()) {
    if (now - game.createdAt > oneHour) {
      games.delete(gameId);
    }
  }
}

function joinGame() {
  // Try to find a waiting game
  for (const game of games.values()) {
    if (game.status === "waiting" && game.players.length < 2) {
      return game;
    }
  }
  // Else create new
  return createGame();
}

export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res
      .status(405)
      .end(JSON.stringify({ error: "Method not allowed. Use POST." }));
  }

  try {
    const game = joinGame();

    let assignedSymbol = null;
    let playerId = null;
    
    if (game.players.length === 0) {
      assignedSymbol = "X";
      playerId = `p1_${Math.random().toString(36).slice(2, 6)}`;
      game.players.push({ id: playerId, symbol: "X" });
      game.status = "waiting";
    } else if (game.players.length === 1) {
      assignedSymbol = "O";
      playerId = `p2_${Math.random().toString(36).slice(2, 6)}`;
      game.players.push({ id: playerId, symbol: "O" });
      game.status = "ongoing";
    } else {
      // If full, create another game and assign X
      const newGame = createGame();
      assignedSymbol = "X";
      playerId = `p1_${Math.random().toString(36).slice(2, 6)}`;
      newGame.players.push({ id: playerId, symbol: "X" });
      return res.status(200).json({
        gameId: newGame.id,
        player: assignedSymbol,
        playerId: playerId,
        board: newGame.board,
        nextTurn: newGame.nextTurn,
        status: newGame.status,
        message: "Bergabung sebagai Player 1 (X). Menunggu Player 2..."
      });
    }

    return res.status(200).json({
      gameId: game.id,
      player: assignedSymbol,
      playerId: playerId,
      board: formatBoardForDisplay(game.board),
      nextTurn: game.nextTurn,
      status: game.status,
      message: game.players.length === 1 
        ? "Bergabung sebagai Player 1 (X). Menunggu Player 2..." 
        : "Game dimulai! Player 1 (X) jalan pertama."
    });
  } catch (e) {
    console.error("Error in join game:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Format board untuk display yang lebih user-friendly
function formatBoardForDisplay(board) {
  const displayBoard = [];
  for (let i = 0; i < 9; i++) {
    displayBoard.push(board[i] === null ? (i + 1).toString() : board[i]);
  }
  return displayBoard;
}
