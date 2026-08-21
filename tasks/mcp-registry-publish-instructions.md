# MCP Registry Publish Instructions

**Target listing:** `app.terminalplus/airport-concierge`
**Registry:** https://registry.modelcontextprotocol.io

---

## What's Ready

- **`server.json`** — Validated manifest at project root (passes `mcp-publisher validate`)
- **`public/.well-known/mcp-registry-auth`** — HTTP domain verification file (ECDSA P-384)
- **`mcp-publisher` CLI** — Installed at `~/Desktop/terminal-plus-frontend/mcp-publisher`
- **`mcp-registry-key.pem`** — Private key for signing (DO NOT commit this file)

---

## Before You Can Publish: Fix terminalplus.app DNS

The registry needs to verify domain ownership by fetching `https://terminalplus.app/.well-known/mcp-registry-auth`. Currently `terminalplus.app` DNS points to the wrong IP (`192.64.119.21` instead of Vercel).

**In Namecheap (or wherever the domain is registered):**

Option A — Point to Vercel via CNAME:
- Delete any A record for `@` pointing to `192.64.119.21`
- Add CNAME: `@` → `cname.vercel-dns.com`

Option B — Add Vercel's A records:
- Change the A record for `@` to `76.76.21.21` (Vercel's IP)

After DNS propagates (~30 min), verify with:
```bash
curl -s https://terminalplus.app/.well-known/mcp-registry-auth
```
Should return: `v=MCPv1; k=ecdsap384; p=A97W1XqcI/p23PbK29eAFsrqRtgMqDo1EUEiqncxrPWxC8KPEjKDrvqwonVizWxbPA==`

---

## Step 1: Authenticate with the Registry

Once DNS is working, run from the project root:

```bash
cd ~/Desktop/terminal-plus-frontend

PRIVATE_KEY="$(openssl ec -in mcp-registry-key.pem -noout -text | grep -A4 "priv:" | tail -n +2 | tr -d ' :\n')"
./mcp-publisher login http --domain "terminalplus.app" --private-key "${PRIVATE_KEY}"
```

You should see:
```
✓ Successfully logged in
```

---

## Step 2: Publish

```bash
./mcp-publisher publish
```

Expected output:
```
Publishing to https://registry.modelcontextprotocol.io...
✓ Successfully published
✓ Server app.terminalplus/airport-concierge version 1.0.0
```

---

## Step 3: Verify

```bash
curl -s "https://registry.modelcontextprotocol.io/v0.1/servers?search=app.terminalplus" | python3 -m json.tool
```

Your server should appear in search results.

---

## Alternative: GitHub Auth (No DNS Required)

If you want to publish without fixing DNS, you can use GitHub auth instead. The tradeoff is the name must be `io.github.vibegpt/airport-concierge` instead of `app.terminalplus/airport-concierge`.

1. Edit `server.json` — change `name` to `io.github.vibegpt/airport-concierge`
2. Run: `./mcp-publisher login github`
3. Follow the GitHub OAuth flow in browser
4. Run: `./mcp-publisher publish`

---

## Security Notes

- **`mcp-registry-key.pem`** is your private signing key. Keep it safe, don't commit it to git.
- The `.gitignore` should already exclude `*.pem` files. If not, add `mcp-registry-key.pem` to `.gitignore`.
- The public key in `.well-known/mcp-registry-auth` is safe to commit — it's meant to be public.
