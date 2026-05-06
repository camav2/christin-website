# Airtable Setup — Christine Conversation Storage

## Step 1 — Create the base

1. Go to airtable.com → **Add a base → Start from scratch**
2. Name it: `Christine — Write Now`
3. Rename the default table to: `Christine Conversations`

---

## Step 2 — Set up the fields

Delete all default fields and create these exact ones (field names are case-sensitive):

| Field name | Field type | Notes |
|---|---|---|
| `Session ID` | Single line text | Unique ID per page visit |
| `Role` | Single select | Add options: `user`, `assistant` |
| `Message` | Long text | The message content |
| `Persona` | Single line text | Which selector option they chose |
| `Page URL` | URL | The page they were on |
| `Timestamp` | Date | Enable "Include time" option |

---

## Step 3 — Get your credentials

### Base ID
1. Open your base in Airtable
2. Look at the URL: `https://airtable.com/appXXXXXXXXXXXXXX/...`
3. The `appXXXXXXXXXXXXXX` part is your Base ID

### API Key
1. Go to airtable.com/create/tokens
2. Click **Create new token**
3. Name it: `Christine Logger`
4. Scopes: add `data.records:write`
5. Access: select your `Christine — Write Now` base
6. Click **Create token** and copy it

---

## Step 4 — Add to Netlify environment variables

In Netlify → **Site configuration → Environment variables**, add:

| Key | Value |
|---|---|
| `AIRTABLE_API_KEY` | Your personal access token from step 3 |
| `AIRTABLE_BASE_ID` | Your base ID (starts with `app`) |
| `AIRTABLE_TABLE` | `Christine Conversations` |

Redeploy after adding.

---

## Step 5 — Verify it's working

Send a test message in the Christine widget, then check your Airtable base.
You should see two new rows — one for the user message, one for Christine's reply — both with the same Session ID.

---

## Useful Airtable views to create

Once data is flowing, set up these views:

**By Session** — Group by `Session ID`, sort by `Timestamp` ascending
→ See each full conversation in order

**User messages only** — Filter where `Role = user`
→ See exactly what questions visitors are asking

**This week** — Filter where `Timestamp` is within the last 7 days
→ Monitor recent activity

**Unanswered patterns** — Sort by `Message` length descending, filter `Role = user`
→ Find long, complex questions that might need better answers in the system prompt
