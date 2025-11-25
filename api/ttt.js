// Create/join game (multiplayer)
// POST /api/ttt
// Response: { gameId, player, board, nextTurn }

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
    createdAt: Date.now(),
    lastActivity: Date.now()
  };
  games.set(gameId, game);
  
  console.log(`Game created: ${gameId}`);
  return game;
}

function findWaitingGame() {
  for (const game of games.values()) {
    if (game.status === "waiting" && game.players.length === 1) {
      console.log(`Found waiting game: ${game.id}`);
      return game;
    }
  }
  return null;
}

function joinGame(playerId = null) {
  // Try to find a waiting game with exactly 1 player
  const waitingGame = findWaitingGame();
  
  if (waitingGame) {
    console.log(`Joining existing game: ${waitingGame.id}`);
    waitingGame.lastActivity = Date.now();
    return waitingGame;
  }
  
  // Else create new game
  console.log(`Creating new game - no waiting games found`);
  return createGame();
}

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
    const { gameId, joinExisting } = req.body || {};
    
    let game;
    
    // Jika ada gameId, coba join game yang spesifik
    if (gameId && games.has(gameId)) {
      game = games.get(gameId);
      console.log(`Joining specific game: ${gameId}, current players: ${game.players.length}`);
    } else {
      // Else find or create game
      game = joinGame();
    }

    let assignedSymbol = null;
    let playerId = null;
    
    if (game.players.length === 0) {
      // Player 1 (X)
      assignedSymbol = "X";
      playerId = generatePlayerId('X');
      game.players.push({ id: playerId, symbol: "X" });
      game.status = "waiting";
      console.log(`Assigned Player 1 (X) to game ${game.id}`);
      
    } else if (game.players.length === 1) {
      // Player 2 (O) - join existing game
      assignedSymbol = "O";
      playerId = generatePlayerId('O');
      game.players.push({ id: playerId, symbol: "O" });
      game.status = "ongoing";
      console.log(`Assigned Player 2 (O) to game ${game.id}. Game started!`);
      
    } else {
      // Game full, create new
      console.log(`Game ${game.id} full, creating new game`);
      const newGame = createGame();
      assignedSymbol = "X";
      playerId = generatePlayerId('X');
      newGame.players.push({ id: playerId, symbol: "X" });
      
      return res.status(200).json({
        gameId: newGame.id,
        player: assignedSymbol,
        playerId: playerId,
        board: formatBoardForDisplay(newGame.board),
        nextTurn: newGame.nextTurn,
        status: newGame.status,
        message: "Bergabung sebagai Player 1 (X). Menunggu Player 2..."
      });
    }

    // Update last activity
    game.lastActivity = Date.now();

    const response = {
      gameId: game.id,
      player: assignedSymbol,
      playerId: playerId,
      board: formatBoardForDisplay(game.board),
      nextTurn: game.nextTurn,
      status: game.status,
      players: game.players,
      message: game.players.length === 1 
        ? "Bergabung sebagai Player 1 (X). Menunggu Player 2..." 
        : "Game dimulai! Player 1 (X) jalan pertama."
    };

    console.log(`Game ${game.id} response:`, {
      players: game.players.length,
      status: game.status
    });

    return res.status(200).json(response);
    
  } catch (e) {
    console.error("Error in join game:", e);
    return res.status(500).json({ error: "Internal server error: " + e.message });
  }
}

// Endpoint untuk get semua games (debug)
export function config = {
  api: {
    externalResolver: true,
  },
}
