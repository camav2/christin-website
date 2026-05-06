/**
 * Christine — Conversation Logger
 * Netlify Function: logs each message to Airtable in real-time
 * Called from the browser on every send/receive — separate from chat function
 * so logging failures never break the chat experience.
 */

const ALLOWED_ORIGINS = [
  "https://www.expertauthor.community",
  "https://expertauthor.community",
];

exports.handler = async (event) => {
  const origin = event.headers.origin || "";

  const corsHeaders = {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin)
      ? origin
      : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: corsHeaders, body: "" };
  }

  let payload;
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error("Missing Airtable env vars");
    return { statusCode: 500, headers: corsHeaders, body: "" };
  }

  try {
    payload = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers: corsHeaders, body: "" };
  }

  const {
    session_id,
    role,        // "user" or "assistant"
    message,
    persona,     // e.g. "Option 1 — no idea yet"
    page_url,
    timestamp,
  } = payload;

  // Validate required fields
  if (!session_id || !role || !message) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Missing required fields" }),
    };
  }

  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_TABLE = process.env.AIRTABLE_TABLE;

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            "Session ID":  session_id,
            "Role":        role,
            "Message":     message.slice(0, 10000),
            "Persona":     persona || "Unknown",
            "Page URL":    page_url || "",
            "Timestamp":   timestamp || new Date().toISOString(),
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("Airtable error:", err);
      return { statusCode: 502, headers: corsHeaders, body: "" };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    console.error("Log function error:", err);
    return { statusCode: 500, headers: corsHeaders, body: "" };
  }
};
