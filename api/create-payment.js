export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { sourceId } = req.body;

    const response = await fetch("https://connect.squareup.com/v2/payments", {
      method: "POST",
      headers: {
        "Square-Version": "2024-06-04",
        "Authorization": `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        source_id: sourceId,
        idempotency_key: crypto.randomUUID(),
        location_id: "LV9XSE8KC6F93",
        amount_money: {
          amount: 2500,
          currency: "USD"
        }
      })
    });

    const data = await response.json();
    res.status(200).json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
