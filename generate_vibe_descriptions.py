#!/usr/bin/env python3
"""Generate vibe-contextual descriptions for Terminal+ amenities."""

import ssl, json, time, urllib.request, urllib.error

SUPABASE_URL  = "https://bpbyhdjdezynyiclqezy.supabase.co"
SUPABASE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwYnloZGpkZXp5bnlpY2xxZXp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTQ5OTQxMiwiZXhwIjoyMDYxMDc1NDEyfQ.X1zo8WOB11FdwCiQdX18i38lU6SMzTouOT-KE_1CjIE"
ANTHROPIC_KEY = "REPLACE_ME"
CLAUDE_MODEL  = "claude-haiku-4-5-20251001"

VIBE_CONTEXT = {
    "chill":   "traveller wants to slow down, decompress and find calm; not in a rush",
    "refuel":  "traveller is hungry or thirsty and wants satisfying food or drink",
    "explore": "traveller is curious and wants to discover hidden gems or unique experiences",
    "comfort": "traveller is tired or stressed and needs rest and care",
    "work":    "traveller needs to be productive with WiFi, power, and quiet focus",
    "shop":    "traveller wants to browse, buy gifts, or treat themselves",
    "quick":   "traveller has limited time and needs fast efficient service",
}

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE

def supabase_get(path):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    req = urllib.request.Request(url, headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    })
    with urllib.request.urlopen(req, context=SSL_CTX) as r:
        return json.loads(r.read())

def supabase_upsert(table, payload):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    body = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=body, method="POST", headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    })
    try:
        with urllib.request.urlopen(req, context=SSL_CTX) as r:
            return r.read()
    except urllib.error.HTTPError as e:
        raise Exception(f"HTTP {e.code}: {e.read().decode()}")

def call_claude(prompt):
    url = "https://api.anthropic.com/v1/messages"
    body = json.dumps({
        "model": CLAUDE_MODEL,
        "max_tokens": 120,
        "messages": [{"role": "user", "content": prompt}],
    }).encode()
    req = urllib.request.Request(url, data=body, method="POST", headers={
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
    })
    with urllib.request.urlopen(req, context=SSL_CTX) as r:
        data = json.loads(r.read())
    return data["content"][0]["text"].strip()

def build_prompt(name, terminal, generic_desc, vibe):
    ctx = VIBE_CONTEXT[vibe]
    return (
        f"You write microcopy for Terminal+, a premium airport app at Singapore Changi.\n\n"
        f"Write a single description (max 45 words, no hashtags, no emojis) for '{name}' "
        f"({terminal}) that speaks to a traveller whose current need is: {ctx}.\n\n"
        f"Generic description for context: '{generic_desc}'\n\n"
        f"Rules:\n"
        f"- Lead with the emotional payoff, not product features\n"
        f"- Be specific to this amenity\n"
        f"- Write in second person or present tense\n"
        f"- Never start with the amenity name\n"
        f"- Sound like a knowledgeable local friend, not a brochure\n\n"
        f"Output ONLY the description text."
    )

def parse_vibe_tags(raw):
    if raw is None: return []
    if isinstance(raw, list): return [v.lower().strip() for v in raw]
    if isinstance(raw, str):
        raw = raw.strip()
        if raw.startswith("["):
            try: return [v.lower().strip() for v in json.loads(raw)]
            except: pass
        return [v.lower().strip().strip('"') for v in raw.split(",") if v.strip()]
    return []

MIGRATION_SQL = """
CREATE TABLE IF NOT EXISTS amenity_vibe_descriptions (
    id          BIGSERIAL PRIMARY KEY,
    amenity_id  BIGINT NOT NULL REFERENCES amenity_detail(id) ON DELETE CASCADE,
    vibe        TEXT NOT NULL CHECK (vibe IN ('chill','refuel','explore','comfort','work','shop','quick')),
    description TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (amenity_id, vibe)
);
CREATE INDEX IF NOT EXISTS idx_avd_amenity ON amenity_vibe_descriptions(amenity_id);
ALTER TABLE amenity_vibe_descriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON amenity_vibe_descriptions FOR SELECT USING (true);
"""

def main():
    print("Terminal+ Vibe Description Generator")
    print("=" * 50)

    if ANTHROPIC_KEY == "REPLACE_ME":
        print("ERROR: Set ANTHROPIC_KEY at the top of the script first.")
        return

    print("Fetching SIN amenities...")
    amenities = supabase_get(
        "amenity_detail?select=id,name,description,vibe_tags,terminal_code"
        "&airport_code=eq.SIN&order=id.asc"
    )
    print(f"  Found {len(amenities)} amenities")

    print("Fetching existing vibe descriptions...")
    try:
        existing_raw = supabase_get("amenity_vibe_descriptions?select=amenity_id,vibe")
        existing = {(r["amenity_id"], r["vibe"]) for r in existing_raw}
        print(f"  {len(existing)} already generated")
    except Exception as e:
        print(f"  Table missing. Run this SQL in Supabase dashboard first:")
        print(MIGRATION_SQL)
        return

    work = []
    for a in amenities:
        for vibe in parse_vibe_tags(a.get("vibe_tags")):
            if vibe in VIBE_CONTEXT and (a["id"], vibe) not in existing:
                work.append((a, vibe))

    if not work:
        print("Nothing to generate - all done!")
        return

    print(f"Generating {len(work)} descriptions...\n")
    success = errors = 0

    for i, (amenity, vibe) in enumerate(work, 1):
        name     = amenity.get("name", "Unknown")
        desc     = amenity.get("description") or "No description"
        terminal = amenity.get("terminal_code", "SIN")
        aid      = amenity["id"]

        print(f"[{i:3d}/{len(work)}] {name[:32]:<32} {vibe:<8}", end=" ", flush=True)
        try:
            vibe_desc = call_claude(build_prompt(name, terminal, desc, vibe))
            if len(vibe_desc) > 300:
                vibe_desc = vibe_desc[:297] + "..."
            supabase_upsert("amenity_vibe_descriptions",
                {"amenity_id": aid, "vibe": vibe, "description": vibe_desc})
            print(f"OK  {vibe_desc[:55]}")
            success += 1
        except Exception as e:
            print(f"ERR {e}")
            errors += 1
        time.sleep(0.4)

    print(f"\n{'='*50}")
    print(f"Done. Generated: {success}  Errors: {errors}  Skipped: {len(existing)}")

if __name__ == "__main__":
    main()
