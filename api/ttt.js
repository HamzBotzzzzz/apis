// Create/join game (multiplayer)
// POST /api/ttt

let games = new Map();

function createGame() {
  const gameId = Math.random().toString(36).slice(2, 10);
  const board = Array(9).fill(null);
  const game = {
    id: gameId,
    board,
    players: [],
    nextTurn: "X",
    status: "waiting",
    createdAt: Date.now(),
    lastActivity: Date.now()
  };
  games.set(gameId, game);
  
  console.log(`🎮 Game created: ${gameId}`);
  return game;
}

function findWaitingGame() {
  for (const game of games.values()) {
    if (game.status === "waiting" && game.players.length === 1) {
      console.log(`🔍 Found waiting game: ${game.id}`);
      return game;
    }
  }
  return null;
}

function formatBoardForDisplay(board) {
  return board.map((cell, index) => cell === null ? (index + 1).toString() : cell);
}

function generatePlayerId(symbol) {
  const prefix = symbol === 'X' ? 'p1' : 'p2';
  return `${prefix}_${Math.random().toString(36).slice(2, 6)}`;
}

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    console.log('📥 Received TTT request');
    
    // Cari game yang waiting
    let game = findWaitingGame();
    
    // Jika tidak ada game yang waiting, buat baru
    if (!game) {
      console.log('🆕 No waiting games, creating new one');
      game = createGame();
    }

    let assignedSymbol, playerId;

    if (game.players.length === 0) {
      // Player 1 (X)
      assignedSymbol = "X";
      playerId = generatePlayerId('X');
      game.players.push({ id: playerId, symbol: "X" });
      game.status = "waiting";
      console.log(`👤 Player 1 joined: ${game.id}`);
      
    } else if (game.players.length === 1) {
      // Player 2 (O)
      assignedSymbol = "O";
      playerId = generatePlayerId('O');
      game.players.push({ id: playerId, symbol: "O" });
      game.status = "ongoing";
      console.log(`👤 Player 2 joined: ${game.id}, Game started!`);
      
    } else {
      // Game penuh, buat baru
      console.log('🔄 Game full, creating new one');
      game = createGame();
      assignedSymbol = "X";
      playerId = generatePlayerId('X');
      game.players.push({ id: playerId, symbol: "X" });
    }

    // Update activity
    game.lastActivity = Date.now();

    const response = {
      success: true,
      gameId: game.id,
      player: assignedSymbol,
      playerId: playerId,
      board: formatBoardForDisplay(game.board),
      nextTurn: game.nextTurn,
      status: game.status,
      players: game.players.map(p => ({ id: p.id, symbol: p.symbol })),
      message: game.status === 'waiting' 
        ? "Bergabung sebagai Player 1 (X). Menunggu Player 2..." 
        : "Game dimulai! Player 1 (X) jalan pertama."
    };

    console.log(`✅ Response for game ${game.id}:`, {
      players: game.players.length,
      status: game.status
    });

    return res.status(200).json(response);
    
  } catch (error) {
    console.error('❌ Error in TTT API:', error);
    return res.status(500).json({ 
      success: false,
      error: "Internal server error",
      message: error.message 
    });
  }
}
