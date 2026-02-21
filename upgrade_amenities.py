#!/usr/bin/env python3
"""
Combined script:
1. Re-fetches all SIN amenity images at maxwidth=1600 → uploads to Supabase Storage
2. Generates rich traveller-focused descriptions via Claude API → updates database

Run: python3 upgrade_amenities.py
"""

import time
import re
import requests
import anthropic

SUPABASE_URL = "https://bpbyhdjdezynyiclqezy.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwYnloZGpkZXp5bnlpY2xxZXp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTQ5OTQxMiwiZXhwIjoyMDYxMDc1NDEyfQ.X1zo8WOB11FdwCiQdX18i38lU6SMzTouOT-KE_1CjIE"
ANTHROPIC_API_KEY = "ANTHROPIC_API_KEY_REDACTED"
BUCKET_NAME = "amenities"
TABLE_NAME = "amenity_detail"

HEADERS = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json"
}

claude = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

# ── Supabase helpers ──────────────────────────────────────────────

def fetch_sin_amenities():
    """Fetch all SIN amenities."""
    url = f"{SUPABASE_URL}/rest/v1/{TABLE_NAME}"
    params = {
        "select": "id,amenity_slug,name,description,vibe_tags,category,terminal_code,price_level,opening_hours,logo_url",
        "airport_code": "eq.SIN",
        "limit": "1000"
    }
    resp = requests.get(url, headers=HEADERS, params=params)
    resp.raise_for_status()
    return resp.json()

def upload_image_to_supabase(slug, image_bytes, mime_type, ext):
    """Upload image bytes to Supabase Storage, return public URL."""
    filename = f"{slug}.{ext}"
    upload_url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{filename}"
    upload_headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": mime_type,
        "x-upsert": "true"
    }
    resp = requests.post(upload_url, headers=upload_headers, data=image_bytes)
    if resp.status_code not in (200, 201):
        raise Exception(f"Upload failed {resp.status_code}: {resp.text}")
    return f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{filename}"

def update_amenity(amenity_id, updates: dict):
    """Patch one or more fields on an amenity."""
    url = f"{SUPABASE_URL}/rest/v1/{TABLE_NAME}"
    params = {"id": f"eq.{amenity_id}"}
    patch_headers = {**HEADERS, "Prefer": "return=minimal"}
    resp = requests.patch(url, headers=patch_headers, params=params, json=updates)
    resp.raise_for_status()

# ── Image helpers ─────────────────────────────────────────────────

def upgrade_image_url(url: str) -> str:
    """Replace maxwidth=800 with maxwidth=1600 in Google Places URL."""
    return re.sub(r'maxwidth=\d+', 'maxwidth=1600', url)

def download_image(url: str):
    """Download image, return (bytes, mime, ext)."""
    resp = requests.get(url, timeout=20)
    resp.raise_for_status()
    ct = resp.headers.get("Content-Type", "image/jpeg")
    if "png" in ct:
        return resp.content, "image/png", "png"
    elif "webp" in ct:
        return resp.content, "image/webp", "webp"
    else:
        return resp.content, "image/jpeg", "jpg"

def is_supabase_url(url: str) -> bool:
    return "supabase.co/storage" in url

def has_google_photo_reference(url: str) -> bool:
    return "photo_reference=" in url

# ── Description generation ────────────────────────────────────────

TERMINAL_NAMES = {
    'SIN-T1': 'Terminal 1',
    'SIN-T2': 'Terminal 2',
    'SIN-T3': 'Terminal 3',
    'SIN-T4': 'Terminal 4',
    'SIN-JEWEL': 'Jewel Changi',
}

def needs_better_description(description: str) -> bool:
    """True if description is missing or too short/generic."""
    if not description or not description.strip():
        return True
    if len(description.strip()) < 60:
        return True
    return False

def generate_description(amenity: dict) -> str:
    """Use Claude to write a rich traveller-focused description."""
    terminal = TERMINAL_NAMES.get(amenity.get('terminal_code', ''), amenity.get('terminal_code', ''))
    existing = amenity.get('description', '').strip()
    existing_note = f"Existing description (improve on this): {existing}" if existing else "No existing description."

    prompt = f"""You are writing app descriptions for Terminal+, a premium airport companion app at Singapore Changi Airport.

Write a 2-3 sentence description for this amenity. 

Rules:
- Write for a stressed or tired traveller who needs to quickly understand if this is worth visiting
- Lead with the most compelling/unique thing about it
- Be specific and practical (mention signature items, key features, what makes it worth the trip)
- Mention if it's good for layovers, transit passengers, or specific situations
- Avoid marketing fluff like "world-class" or "exceptional"
- Max 60 words
- No hashtags, no emojis

Amenity details:
Name: {amenity.get('name', '')}
Category: {amenity.get('category', '')}
Vibe tags: {amenity.get('vibe_tags', '')}
Terminal: {terminal}
Price level: {amenity.get('price_level', '')}
Hours: {amenity.get('opening_hours', '')}
{existing_note}

Write only the description, no preamble."""

    message = claude.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=150,
        messages=[{"role": "user", "content": prompt}]
    )
    return message.content[0].text.strip()

# ── Main ──────────────────────────────────────────────────────────

def main():
    print("Fetching SIN amenities...")
    amenities = fetch_sin_amenities()
    print(f"Found {len(amenities)} amenities\n")

    img_success = 0
    img_skip = 0
    img_fail = []
    desc_success = 0
    desc_skip = 0
    desc_fail = []

    for i, amenity in enumerate(amenities):
        slug = amenity.get('amenity_slug') or f"amenity-{amenity['id']}"
        name = amenity.get('name', slug)
        logo_url = amenity.get('logo_url', '')
        
        print(f"[{i+1}/{len(amenities)}] {name}")

        updates = {}

        # ── Phase 1: Image upgrade ──
        if is_supabase_url(logo_url):
            # Already migrated — re-fetch original Google URL at higher res
            # We need to check if original reference is embedded or lost
            # Since we stored clean Supabase URLs, we must re-fetch from Google Places
            # using the slug to find the place — skip if no google ref available
            img_skip += 1
            print(f"  📸 Image: already in Supabase storage (skip re-fetch)")
        elif has_google_photo_reference(logo_url):
            try:
                hd_url = upgrade_image_url(logo_url)
                image_bytes, mime, ext = download_image(hd_url)
                new_url = upload_image_to_supabase(slug, image_bytes, mime, ext)
                updates['logo_url'] = new_url
                img_success += 1
                print(f"  📸 Image: ✅ upgraded to 1600px")
            except Exception as e:
                img_fail.append({'name': name, 'error': str(e)})
                print(f"  📸 Image: ❌ {e}")
        elif not logo_url:
            img_skip += 1
            print(f"  📸 Image: no URL, skipping")
        else:
            img_skip += 1
            print(f"  📸 Image: unknown URL format, skipping")

        # ── Phase 2: Description generation ──
        description = amenity.get('description', '')
        if needs_better_description(description):
            try:
                new_desc = generate_description(amenity)
                updates['description'] = new_desc
                desc_success += 1
                print(f"  ✍️  Description: ✅ generated")
                time.sleep(0.2)  # rate limit courtesy
            except Exception as e:
                desc_fail.append({'name': name, 'error': str(e)})
                print(f"  ✍️  Description: ❌ {e}")
        else:
            desc_skip += 1
            print(f"  ✍️  Description: existing ok, skipping")

        # ── Write all updates in one DB call ──
        if updates:
            try:
                update_amenity(amenity['id'], updates)
            except Exception as e:
                print(f"  💾 DB update failed: {e}")

        # Small delay to be respectful
        time.sleep(0.1)

    # ── Summary ──
    print(f"\n{'='*55}")
    print(f"IMAGES:       ✅ {img_success} upgraded  |  ⏭️  {img_skip} skipped  |  ❌ {len(img_fail)} failed")
    print(f"DESCRIPTIONS: ✅ {desc_success} generated  |  ⏭️  {desc_skip} skipped  |  ❌ {len(desc_fail)} failed")

    if img_fail:
        print(f"\nImage failures:")
        for f in img_fail:
            print(f"  - {f['name']}: {f['error']}")
    if desc_fail:
        print(f"\nDescription failures:")
        for f in desc_fail:
            print(f"  - {f['name']}: {f['error']}")

if __name__ == "__main__":
    main()
