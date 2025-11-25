import { getGame, cleanupOldGames } from '/lib/ttt-db.js';

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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await cleanupOldGames();
    const { gameId } = req.query;
    
    if (!gameId) {
      return res.status(400).json({ error: "Game ID diperlukan" });
    }

    console.log(`📊 STATUS request: ${gameId}`);

    const game = await getGame(gameId);
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
    
  } catch (error) {
    console.error('❌ STATUS Error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
