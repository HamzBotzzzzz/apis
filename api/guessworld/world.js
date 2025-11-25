import data from "./list.json" assert { type: "json" };

// GET /api/guessworld/world
// Return satu negara random: { negara, petunjuk }
export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "GET") {
    return res.status(405).end(JSON.stringify({ error: "Method not allowed. Use GET." }));
  }

  const idx = Math.floor(Math.random() * data.length);
  const { negara, petunjuk } = data[idx];

  return res.status(200).end(JSON.stringify({ negara, petunjuk }));
}