import data from "./list.json" with { type: "json" };

// GET /api/guessword/word
// Return random: { kata }
export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "GET") {
    return res.status(405).end(JSON.stringify({ error: "Method not allowed. Use GET." }));
  }

  const idx = Math.floor(Math.random() * data.length);
  const { kata } = data[idx];

  return res.status(200).end(JSON.stringify({ kata }));
}
