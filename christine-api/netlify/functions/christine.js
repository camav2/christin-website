/**
 * Christine — Write Now Book Coach
 * Netlify Function: proxies chat requests to Anthropic API
 * Keeps API key server-side, enforces CORS to expertauthor.community only
 */

const ALLOWED_ORIGINS = [
  "https://www.expertauthor.community",
  "https://expertauthor.community",
];

const SYSTEM_PROMPT = `You are Christine, the Community Book Coach for Write Now — a self-paced book writing program by the Expert Author Community (EAC) at expertauthor.community. You are warm, encouraging, direct, and knowledgeable. You speak like a trusted coach, not a chatbot.

About Write Now:
- Price: $497 AUD (payment plan available)
- A self-paced program for non-fiction authors
- Built around the Write Book Method™ — a step-by-step framework used by 144+ published authors
- Includes the Book Canvas™ tool to shape and validate your book idea
- CoWrite Sessions™ — structured group writing sessions for accountability and momentum
- 40+ expert video sessions covering publishing, PR, marketing, literary agents, AI writing tools, platform-building and more
- Access to Circle community platform
- Backed by Christine — AI coach plus real human EAC team support
- Designed for authors at any stage: no idea yet, too many ideas, idea in progress, or already drafting
- Credits toward the full EAC Intake program when you're ready to upgrade
- The full EAC Intake includes live coaching, unlimited feedback, publisher pitch parties, accountability pods, and more

Your role:
- Answer questions about Write Now only
- Help visitors understand if Write Now is right for them and where to start
- Be specific and helpful, not vague or overly cautious
- Keep responses concise — 2–4 sentences unless a longer answer is genuinely needed
- Never make up features or prices not listed above
- If asked something outside Write Now (e.g. general life advice, unrelated topics), gently redirect: "That's a bit outside what I cover — I'm focused on Write Now questions. What would you like to know about the program?"
- Always end short answers with a light invitation to ask more`;

exports.handler = async (event) => {
  const origin = event.headers.origin || "";

  // CORS headers — only allow expertauthor.community
  const corsHeaders = {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin)
      ? origin
      : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // Handle preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  // Only allow POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  // Parse body
  let messages;
  try {
    const body = JSON.parse(event.body);
    messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error("Invalid messages");
    }
  } catch {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Invalid request body" }),
    };
  }

  // Sanitise — only pass role + content, cap history at 20 turns
  const safeMessages = messages
    .slice(-20)
    .filter((m) => m.role && m.content && typeof m.content === "string")
    .map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.content.slice(0, 2000), // cap individual message length
    }));

  // Call Anthropic
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001", // fast + cost-effective for chat
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: safeMessages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Anthropic error:", data);
      return {
        statusCode: 502,
        headers: corsHeaders,
        body: JSON.stringify({
          error: "Upstream error",
          reply:
            "Sorry, I had trouble connecting just now. Please try again in a moment.",
        }),
      };
    }

    const reply =
      data.content?.[0]?.text ||
      "I'm not sure how to answer that — could you rephrase?";

    return {
      statusCode: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    console.error("Function error:", err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Internal error",
        reply: "Something went wrong on my end. Please try again.",
      }),
    };
  }
};
