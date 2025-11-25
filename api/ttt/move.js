// Submit move - FIX PERSISTENCE
let games = global.tttGames || new Map();
global.tttGames = games;

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

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { gameId, playerId, position } = req.body;
    
    if (!gameId || !playerId || position === undefined) {
      return res.status(400).json({ error: "Payload tidak valid" });
    }

    console.log(`🎯 MOVE request: game=${gameId}, player=${playerId}, pos=${position}`);
    console.log(`📊 Available games: ${Array.from(games.keys()).join(', ') || 'NONE'}`);

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

    // Validasi player
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
    console.log(`✅ MOVE applied: ${player.symbol} at ${position}`);

    // Check winner
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

    // Check draw
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

    // Next turn
    game.nextTurn = player.symbol === "X" ? "O" : "X";
    
    return res.status(200).json({
      success: true,
      board: formatBoardForDisplay(game.board),
      nextTurn: game.nextTurn,
      winner: null,
      status: game.status,
      message: `Giliran Player ${game.nextTurn}`
    });

  } catch (error) {
    console.error('❌ MOVE Error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
