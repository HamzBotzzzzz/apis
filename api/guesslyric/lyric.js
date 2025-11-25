import data from "./list.json" assert { type: "json" };

// GET /api/guesslyric/lyric
// Return random item: { potongan, jawaban }
export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "GET") {
    return res.status(405).end(JSON.stringify({ error: "Method not allowed. Use GET." }));
  }

  const idx = Math.floor(Math.random() * data.length);
  const { potongan, jawaban } = data[idx];

  return res.status(200).end(JSON.stringify({ potongan, jawaban }));
}