// Submit move
// POST /api/ttt/move

let games = new Map();

function checkWinner(board) {
  const lines = [
    [0,1,2], [3,4,5], [6,7,8], // horizontal
    [0,3,6], [1,4,7], [2,5,8], // vertical
    [0,4,8], [2,4,6] // diagonal
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

function getPlayerSymbol(game, playerId) {
  const player = game.players.find(p => p.id === playerId);
  return player ? player.symbol : null;
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
    const { gameId, playerId, position } = req.body;
    
    // Validasi input
    if (!gameId || !playerId || position === undefined) {
      return res.status(400).json({ 
        success: false,
        error: "Payload tidak valid. Butuh: gameId, playerId, position (1-9)" 
      });
    }

    console.log(`🎯 Move request: game=${gameId}, player=${playerId}, pos=${position}`);

    const game = games.get(gameId);
    if (!game) {
      return res.status(404).json({ 
        success: false,
        error: "Game tidak ditemukan" 
      });
    }

    game.lastActivity = Date.now();

    if (game.status === "finished") {
      return res.status(400).json({ 
        success: false,
        error: "Game sudah selesai",
        board: formatBoardForDisplay(game.board)
      });
    }

    if (game.status === "waiting") {
      return res.status(400).json({ 
        success: false,
        error: "Game belum dimulai. Menunggu player kedua...",
        board: formatBoardForDisplay(game.board)
      });
    }

    // Validasi player
    const playerSymbol = getPlayerSymbol(game, playerId);
    if (!playerSymbol) {
      return res.status(400).json({ 
        success: false,
        error: "Player tidak terdaftar di game ini" 
      });
    }

    // Validasi turn
    if (game.nextTurn !== playerSymbol) {
      return res.status(400).json({ 
        success: false,
        error: "Bukan giliran kamu", 
        board: formatBoardForDisplay(game.board),
        nextTurn: game.nextTurn
      });
    }

    // Convert position (1-9) to index (0-8)
    const index = parseInt(position) - 1;
    
    // Validasi index
    if (index < 0 || index > 8 || isNaN(index)) {
      return res.status(400).json({ 
        success: false,
        error: "Posisi tidak valid. Gunakan angka 1-9",
        board: formatBoardForDisplay(game.board)
      });
    }

    if (game.board[index] !== null) {
      return res.status(400).json({ 
        success: false,
        error: `Posisi ${position} sudah diisi`,
        board: formatBoardForDisplay(game.board)
      });
    }

    // Apply move
    game.board[index] = playerSymbol;
    console.log(`✅ Move applied: ${playerSymbol} at position ${position}`);

    // Check winner
    const winner = checkWinner(game.board);
    if (winner) {
      game.status = "finished";
      const winnerPlayer = game.players.find(p => p.symbol === winner);
      
      console.log(`🏆 Game finished: ${winner} wins!`);
      
      return res.status(200).json({
        success: true,
        board: formatBoardForDisplay(game.board),
        nextTurn: null,
        winner: winner,
        winnerPlayerId: winnerPlayer?.id,
        status: game.status,
        message: `Player ${winner} menang!`
      });
    }

    // Check draw
    if (isDraw(game.board)) {
      game.status = "finished";
      console.log(`🤝 Game finished: Draw!`);
      
      return res.status(200).json({
        success: true,
        board: formatBoardForDisplay(game.board),
        nextTurn: null,
        winner: null,
        status: game.status,
        message: "Game seri!"
      });
    }

    // Ganti giliran
    game.nextTurn = playerSymbol === "X" ? "O" : "X";
    const nextPlayer = game.players.find(p => p.symbol === game.nextTurn);
    
    console.log(`🔄 Next turn: ${game.nextTurn}`);
    
    return res.status(200).json({
      success: true,
      board: formatBoardForDisplay(game.board),
      nextTurn: game.nextTurn,
      nextPlayerId: nextPlayer?.id,
      winner: null,
      status: game.status,
      message: `Giliran Player ${game.nextTurn}`
    });

  } catch (error) {
    console.error('❌ Error in move API:', error);
    return res.status(500).json({ 
      success: false,
      error: "Internal server error",
      message: error.message 
    });
  }
}
