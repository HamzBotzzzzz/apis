// Join specific game
// POST /api/ttt/join

let games = new Map();

function formatBoardForDisplay(board) {
  return board.map((cell, index) => cell === null ? (index + 1).toString() : cell);
}

function generatePlayerId(symbol) {
  return `p${symbol === 'X' ? '1' : '2'}_${Math.random().toString(36).slice(2, 6)}`;
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
    const { gameId } = req.body;
    
    if (!gameId) {
      return res.status(400).json({ 
        success: false,
        error: "Game ID diperlukan" 
      });
    }

    console.log(`🔍 Looking for game: ${gameId}`);
    console.log(`📊 Available games: ${Array.from(games.keys()).join(', ') || 'None'}`);

    const game = games.get(gameId);
    
    if (!game) {
      return res.status(404).json({ 
        success: false,
        error: "Game tidak ditemukan" 
      });
    }

    if (game.status === "finished") {
      return res.status(400).json({ 
        success: false,
        error: "Game sudah selesai" 
      });
    }

    if (game.players.length >= 2) {
      return res.status(400).json({ 
        success: false,
        error: "Game sudah penuh" 
      });
    }

    // Join sebagai player 2
    const assignedSymbol = "O";
    const playerId = generatePlayerId('O');
    
    game.players.push({ id: playerId, symbol: "O" });
    game.status = "ongoing";
    game.lastActivity = Date.now();

    console.log(`✅ Player 2 joined game: ${gameId}`);

    const response = {
      success: true,
      gameId: game.id,
      player: assignedSymbol,
      playerId: playerId,
      board: formatBoardForDisplay(game.board),
      nextTurn: game.nextTurn,
      status: game.status,
      players: game.players.map(p => ({ id: p.id, symbol: p.symbol })),
      message: "Bergabung sebagai Player 2 (O). Game dimulai!"
    };

    return res.status(200).json(response);
    
  } catch (error) {
    console.error('❌ Error in join API:', error);
    return res.status(500).json({ 
      success: false,
      error: "Internal server error",
      message: error.message 
    });
  }
}
