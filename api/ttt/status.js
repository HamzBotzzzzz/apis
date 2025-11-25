// Get game status
// GET /api/ttt/status?gameId=xxx

let games = new Map();

function formatBoardForDisplay(board) {
  return board.map((cell, index) => cell === null ? (index + 1).toString() : cell);
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

function getStatusMessage(game, winner) {
  if (winner) {
    return `Game selesai! Player ${winner} menang!`;
  }
  if (game.status === "finished") {
    return "Game seri!";
  }
  if (game.status === "waiting") {
    return "Menunggu player kedua...";
  }
  return `Giliran Player ${game.nextTurn}`;
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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  try {
    const { gameId } = req.query;
    
    if (!gameId) {
      return res.status(400).json({ 
        success: false,
        error: "Parameter gameId diperlukan" 
      });
    }

    console.log(`📊 Status request for game: ${gameId}`);

    const game = games.get(gameId);
    if (!game) {
      return res.status(404).json({ 
        success: false,
        error: "Game tidak ditemukan" 
      });
    }

    game.lastActivity = Date.now();
    const winner = checkWinner(game.board);
    
    const response = {
      success: true,
      gameId: game.id,
      board: formatBoardForDisplay(game.board),
      nextTurn: game.nextTurn,
      winner: winner,
      status: game.status,
      players: game.players.map(p => ({ id: p.id, symbol: p.symbol })),
      message: getStatusMessage(game, winner)
    };

    console.log(`✅ Status response for ${gameId}: ${game.status}`);

    return res.status(200).json(response);
    
  } catch (error) {
    console.error('❌ Error in status API:', error);
    return res.status(500).json({ 
      success: false,
      error: "Internal server error",
      message: error.message 
    });
  }
}
