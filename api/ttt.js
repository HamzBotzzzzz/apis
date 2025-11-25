// Tic-Tac-Toe API with in-memory storage + auto-cleanup
// Simpan data di memory, tapi dengan cleanup routine

let games = new Map();
let lastCleanup = Date.now();

// Auto cleanup every hour
function autoCleanup() {
  const now = Date.now();
  if (now - lastCleanup > 60 * 60 * 1000) { // 1 hour
    cleanupOldGames();
    lastCleanup = now;
  }
}

function cleanupOldGames() {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  let deleted = 0;
  
  for (const [gameId, game] of games.entries()) {
    if (now - game.lastActivity > oneHour) {
      games.delete(gameId);
      deleted++;
    }
  }
  
  if (deleted > 0) {
    console.log(`🧹 Cleaned up ${deleted} old games`);
  }
}

function createGame() {
  const gameId = Math.random().toString(36).slice(2, 10);
  const game = {
    id: gameId,
    board: Array(9).fill(null),
    players: [],
    nextTurn: "X",
    status: "waiting",
    createdAt: Date.now(),
    lastActivity: Date.now()
  };
  games.set(gameId, game);
  console.log(`🎮 Game CREATED: ${gameId}`);
  return game;
}

function findWaitingGame() {
  for (const game of games.values()) {
    if (game.status === "waiting" && game.players.length === 1) {
      console.log(`🔍 Found WAITING game: ${game.id}`);
      return game;
    }
  }
  return null;
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

function isDraw(board) {
  return board.every(cell => cell !== null);
}

function formatBoardForDisplay(board) {
  return board.map((cell, index) => cell === null ? (index + 1).toString() : cell);
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Run cleanup check
  autoCleanup();

  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  const pathParts = pathname.split('/').filter(Boolean);

  console.log(`📥 Request: ${req.method} ${pathname}`, {
    games: games.size,
    body: req.body
  });

  try {
    // Route: POST /api/ttt - Create/Join game
    if (req.method === 'POST' && pathParts.length === 2 && pathParts[1] === 'ttt') {
      let game = findWaitingGame();
      if (!game) {
        game = createGame();
      }

      let playerData;
      if (game.players.length === 0) {
        playerData = { symbol: "X", id: `p1_${Math.random().toString(36).slice(2, 6)}` };
        game.players.push(playerData);
        game.status = "waiting";
      } else if (game.players.length === 1) {
        playerData = { symbol: "O", id: `p2_${Math.random().toString(36).slice(2, 6)}` };
        game.players.push(playerData);
        game.status = "ongoing";
      } else {
        game = createGame();
        playerData = { symbol: "X", id: `p1_${Math.random().toString(36).slice(2, 6)}` };
        game.players.push(playerData);
      }

      game.lastActivity = Date.now();

      return res.status(200).json({
        success: true,
        gameId: game.id,
        player: playerData.symbol,
        playerId: playerData.id,
        board: formatBoardForDisplay(game.board),
        nextTurn: game.nextTurn,
        status: game.status,
        players: game.players,
        message: game.status === 'waiting' 
          ? "Bergabung sebagai Player 1 (X). Menunggu Player 2..." 
          : "Game dimulai! Player 1 (X) jalan pertama."
      });
    }

    // Route: POST /api/ttt/join - Join specific game
    if (req.method === 'POST' && pathParts.length === 3 && pathParts[1] === 'ttt' && pathParts[2] === 'join') {
      const { gameId } = req.body;
      
      if (!gameId) {
        return res.status(400).json({ error: "Game ID diperlukan" });
      }

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

      const playerData = { symbol: "O", id: `p2_${Math.random().toString(36).slice(2, 6)}` };
      game.players.push(playerData);
      game.status = "ongoing";
      game.lastActivity = Date.now();

      console.log(`✅ Player 2 JOINED: ${gameId}`);

      return res.status(200).json({
        success: true,
        gameId: game.id,
        player: playerData.symbol,
        playerId: playerData.id,
        board: formatBoardForDisplay(game.board),
        nextTurn: game.nextTurn,
        status: game.status,
        message: "Bergabung sebagai Player 2 (O). Game dimulai!"
      });
    }

    // Route: POST /api/ttt/move - Make a move
    if (req.method === 'POST' && pathParts.length === 3 && pathParts[1] === 'ttt' && pathParts[2] === 'move') {
      const { gameId, playerId, position } = req.body;
      
      if (!gameId || !playerId || position === undefined) {
        return res.status(400).json({ error: "Payload tidak valid" });
      }

      const game = games.get(gameId);
      if (!game) {
        return res.status(404).json({ error: "Game tidak ditemukan" });
      }

      game.lastActivity = Date.now();

      if (game.status === "finished") {
        return res.status(400).json({ error: "Game sudah selesai" });
      }

      if (game.status === "waiting") {
        return res.status(400).json({ error: "Game belum dimulai" });
      }

      const player = game.players.find(p => p.id === playerId);
      if (!player) {
        return res.status(400).json({ error: "Player tidak terdaftar" });
      }

      if (game.nextTurn !== player.symbol) {
        return res.status(400).json({ error: "Bukan giliran kamu" });
      }

      const index = parseInt(position) - 1;
      if (index < 0 || index > 8 || isNaN(index)) {
        return res.status(400).json({ error: "Posisi tidak valid" });
      }

      if (game.board[index] !== null) {
        return res.status(400).json({ error: `Posisi ${position} sudah diisi` });
      }

      // APPLY MOVE
      game.board[index] = player.symbol;

      const winner = checkWinner(game.board);
      if (winner) {
        game.status = "finished";
        return res.status(200).json({
          success: true,
          board: formatBoardForDisplay(game.board),
          nextTurn: null,
          winner: winner,
          status: game.status,
          message: `Player ${winner} menang!`
        });
      }

      if (isDraw(game.board)) {
        game.status = "finished";
        return res.status(200).json({
          success: true,
          board: formatBoardForDisplay(game.board),
          nextTurn: null,
          winner: null,
          status: game.status,
          message: "Game seri!"
        });
      }

      game.nextTurn = player.symbol === "X" ? "O" : "X";
      
      return res.status(200).json({
        success: true,
        board: formatBoardForDisplay(game.board),
        nextTurn: game.nextTurn,
        winner: null,
        status: game.status,
        message: `Giliran Player ${game.nextTurn}`
      });
    }

    // Route: GET /api/ttt/status - Get game status
    if (req.method === 'GET' && pathParts.length === 3 && pathParts[1] === 'ttt' && pathParts[2] === 'status') {
      const { gameId } = req.query;
      
      if (!gameId) {
        return res.status(400).json({ error: "Game ID diperlukan" });
      }

      const game = games.get(gameId);
      if (!game) {
        return res.status(404).json({ error: "Game tidak ditemukan" });
      }

      game.lastActivity = Date.now();
      const winner = checkWinner(game.board);
      
      return res.status(200).json({
        success: true,
        gameId: game.id,
        board: formatBoardForDisplay(game.board),
        nextTurn: game.nextTurn,
        winner: winner,
        status: game.status,
        players: game.players,
        message: winner ? `Player ${winner} menang!` : 
                 game.status === 'finished' ? "Game seri!" :
                 game.status === 'waiting' ? "Menunggu player 2..." :
                 `Giliran Player ${game.nextTurn}`
      });
    }

    // Route: GET /api/ttt/debug - Debug info
    if (req.method === 'GET' && pathParts.length === 3 && pathParts[1] === 'ttt' && pathParts[2] === 'debug') {
      return res.status(200).json({
        success: true,
        totalGames: games.size,
        games: Array.from(games.values()).map(g => ({
          id: g.id,
          status: g.status,
          players: g.players.length,
          lastActivity: new Date(g.lastActivity).toISOString()
        }))
      });
    }

    // Default 404
    return res.status(404).json({ error: "Endpoint tidak ditemukan" });

  } catch (error) {
    console.error('❌ API Error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
