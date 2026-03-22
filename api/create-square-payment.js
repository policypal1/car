export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      message: "Method not allowed"
    });
  }

  const SQUARE_BASE_URL = "https://connect.squareup.com";
  const SQUARE_VERSION = "2025-10-16";

  try {
    const { sourceId, idempotencyKey, amountCents, booking } = req.body || {};

    if (!process.env.SQUARE_ACCESS_TOKEN) {
      return res.status(500).json({
        ok: false,
        message: "Missing SQUARE_ACCESS_TOKEN on server"
      });
    }

    if (!sourceId) {
      return res.status(400).json({
        ok: false,
        message: "Missing sourceId"
      });
    }

    if (!idempotencyKey) {
      return res.status(400).json({
        ok: false,
        message: "Missing idempotencyKey"
      });
    }

    if (!amountCents || Number(amountCents) < 1) {
      return res.status(400).json({
        ok: false,
        message: "Invalid amount"
      });
    }

    const payload = {
      source_id: sourceId,
      idempotency_key: idempotencyKey,
      location_id: process.env.SQUARE_LOCATION_ID,
      amount_money: {
        amount: Number(amountCents),
        currency: "USD"
      },
      autocomplete: true,
      note: `Booking deposit for ${booking?.name || "customer"}`,
      reference_id: booking?.slotId || booking?.slotLabel || undefined,
      buyer_email_address: booking?.email || undefined
    };

    const squareRes = await fetch(`${SQUARE_BASE_URL}/v2/payments`, {
      method: "POST",
      headers: {
        "Square-Version": SQUARE_VERSION,
        Authorization: `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const rawText = await squareRes.text();

    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      return res.status(500).json({
        ok: false,
        message: "Square returned non-JSON",
        raw: rawText
      });
    }

    if (!squareRes.ok) {
      return res.status(squareRes.status).json({
        ok: false,
        message: data?.errors?.[0]?.detail || "Square payment failed",
        square: data
      });
    }

    return res.status(200).json({
      ok: true,
      paymentId: data?.payment?.id || "",
      status: data?.payment?.status || "",
      square: data
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: err?.message || "Server error"
    });
  }
}
