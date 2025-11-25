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
    status: "waiting" // "waiting" | "ongoing" | "finished"
  };
  games.set(gameId, game);
  return game;
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
    if (game.players.length === 0) {
      assignedSymbol = "X";
      game.players.push({ id: `p_${Math.random().toString(36).slice(2, 8)}`, symbol: "X" });
      game.status = "waiting";
    } else if (game.players.length === 1) {
      assignedSymbol = "O";
      game.players.push({ id: `p_${Math.random().toString(36).slice(2, 8)}`, symbol: "O" });
      game.status = "ongoing";
    } else {
      // If full, create another game and assign X
      const newGame = createGame();
      assignedSymbol = "X";
      newGame.players.push({ id: `p_${Math.random().toString(36).slice(2, 8)}`, symbol: "X" });
      return res.status(200).end(JSON.stringify({
        gameId: newGame.id,
        player: assignedSymbol,
        board: newGame.board,
        nextTurn: newGame.nextTurn
      }));
    }

    return res.status(200).end(JSON.stringify({
      gameId: game.id,
      player: assignedSymbol,
      board: game.board,
      nextTurn: game.nextTurn
    }));
  } catch (e) {
    return res.status(500).end(JSON.stringify({ error: "Internal error" }));
  }
}