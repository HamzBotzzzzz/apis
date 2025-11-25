import { getGame, saveGame, getAllGames, cleanupOldGames } from '/lib/ttt-db.js';

function createGame() {
  const gameId = Math.random().toString(36).slice(2, 10);
  return {
    id: gameId,
    board: Array(9).fill(null),
    players: [],
    nextTurn: "X",
    status: "waiting",
    createdAt: Date.now(),
    lastActivity: Date.now()
  };
}

function findWaitingGame(games) {
  for (const game of games.values()) {
    if (game.status === "waiting" && game.players.length === 1) {
      return game;
    }
  }
  return null;
}

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
    await cleanupOldGames();
    const games = await getAllGames();
    
    let game = findWaitingGame(games);
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
    await saveGame(game);

    const response = {
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
    };

    console.log(`✅ Game ${game.id} created with ${game.players.length} players`);
    return res.status(200).json(response);
    
  } catch (error) {
    console.error('❌ TTT Error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
