# Christine — Write Now Book Coach
## Production Deployment Guide

---

## What this is

A Netlify serverless function that proxies chat messages to the Anthropic API.
Your API key lives in Netlify's environment variables — never in the browser.

```
User (Webflow) → Netlify Function → Anthropic API → Netlify Function → User
```

---

## Files

```
netlify/
  functions/
    christine.js      ← The serverless function (deploy this)
netlify.toml          ← Netlify config + security headers
webflow-embed.html    ← Paste this into Webflow as a custom code embed
README.md             ← This file
```

---

## Step 1 — Deploy to Netlify

### Option A: Connect a GitHub repo (recommended)

1. Create a new GitHub repo (can be private)
2. Push these files to it:
   ```
   netlify/functions/christine.js
   netlify.toml
   ```
3. Go to [app.netlify.com](https://app.netlify.com) → **Add new site → Import from Git**
4. Connect the repo
5. Build settings: leave blank (no build command needed — functions only)
6. Click **Deploy site**

### Option B: Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

---

## Step 2 — Add your Anthropic API key

1. In Netlify: **Site configuration → Environment variables → Add variable**
2. Key: `ANTHROPIC_API_KEY`
3. Value: your Anthropic API key (from console.anthropic.com)
4. Scopes: **Functions** only
5. Save and **trigger a redeploy**

> Never commit your API key to Git. It must only live in Netlify's environment variables.

---

## Step 3 — Note your Netlify URL

After deploy, Netlify gives you a URL like:
```
https://YOUR-SITE-NAME.netlify.app
```

Your function endpoint will be:
```
https://YOUR-SITE-NAME.netlify.app/.netlify/functions/christine
```

Test it:
```bash
curl -X POST https://YOUR-SITE-NAME.netlify.app/.netlify/functions/christine \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"What is Write Now?"}]}'
```

You should get back:
```json
{"reply": "Write Now is a self-paced book writing program..."}
```

---

## Step 4 — Update the Webflow embed

In `webflow-embed.html`, find this line near the bottom:

```javascript
var API_URL = "https://YOUR_NETLIFY_SITE.netlify.app/.netlify/functions/christine";
```

Replace `YOUR_NETLIFY_SITE` with your actual Netlify subdomain.

---

## Step 5 — Add to Webflow

1. In the Webflow Designer, find the Christine section on the Write Now page
2. Delete the current image/GIF element in the right column
3. Add an **Embed** element in its place
4. Paste the entire contents of `webflow-embed.html` into the embed
5. Save and publish

---

## Step 6 — Add a custom domain to Netlify (optional but recommended)

If you want the API to live on your own domain (e.g. `api.expertauthor.community`):

1. Netlify → **Domain management → Add custom domain**
2. Add `api.expertauthor.community`
3. Add a CNAME record in your DNS pointing to your Netlify site
4. Update `API_URL` in the embed to match

---

## Security notes

- **CORS is locked** to `expertauthor.community` and `www.expertauthor.community` only
  — no other domain can call your function
- **Message history** is capped at 20 turns and each message capped at 2000 chars
  — prevents abuse and runaway costs
- **Model**: uses `claude-haiku-4-5` — fast, cheap, ideal for chat
  — estimated cost: ~$0.001–0.003 per conversation
- **No logging** of conversation content — only errors are logged

---

## Updating Christine's knowledge

All of Christine's knowledge is in the `SYSTEM_PROMPT` constant in `christine.js`.
To update what she knows (new pricing, new features, etc.):
1. Edit `SYSTEM_PROMPT` in `netlify/functions/christine.js`
2. Push to GitHub (or redeploy via CLI)
3. Netlify auto-deploys in ~30 seconds

---

## Troubleshooting

| Problem | Fix |
|---|---|
| 502 error | Check `ANTHROPIC_API_KEY` is set in Netlify env vars |
| CORS error in browser | Check origin is `expertauthor.community` (not a staging URL) — add it to `ALLOWED_ORIGINS` in `christine.js` if needed |
| Function not found (404) | Check `netlify.toml` is in the repo root and `functions = "netlify/functions"` |
| Slow responses | Expected ~1–2s for Haiku. If consistently slow, check Netlify function region |
