import { getGame, saveGame } from '/lib/ttt-db.js';

function formatBoardForDisplay(board) {
  return board.map((cell, index) => cell === null ? (index + 1).toString() : cell);
}

export default async function handler(req, res) {
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

    const game = await getGame(gameId);
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

    await saveGame(game);

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
