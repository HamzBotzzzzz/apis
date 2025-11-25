// Join specific game - FIX PERSISTENCE
let games = global.tttGames || new Map();
global.tttGames = games;

function formatBoardForDisplay(board) {
  return board.map((cell, index) => cell === null ? (index + 1).toString() : cell);
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { gameId } = req.body;
    
    if (!gameId) {
      return res.status(400).json({ error: "Game ID diperlukan" });
    }

    console.log(`🔍 JOIN request: ${gameId}`);
    console.log(`📊 Available games: ${Array.from(games.keys()).join(', ') || 'NONE'}`);

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

    // Join sebagai player 2
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
    
  } catch (error) {
    console.error('❌ JOIN Error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
