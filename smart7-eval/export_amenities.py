#!/usr/bin/env python3
"""
Export amenities from Supabase to local JSON for eval loop.
Run once before starting the Ralph loop.

Usage:
  # Set env vars first:
  export SUPABASE_URL="https://bpbyhdjdezynyiclqezy.supabase.co"
  export SUPABASE_KEY="your_anon_key"
  
  python export_amenities.py
"""

import os
import json
import sys

try:
    import requests
except ImportError:
    print("Installing requests...")
    os.system(f"{sys.executable} -m pip install requests --quiet")
    import requests


def export_amenities():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")

    if not url or not key:
        print("ERROR: Set SUPABASE_URL and SUPABASE_KEY environment variables")
        print("  export SUPABASE_URL='https://bpbyhdjdezynyiclqezy.supabase.co'")
        print("  export SUPABASE_KEY='your_anon_key_here'")
        sys.exit(1)

    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }

    # Fetch all SIN amenities
    endpoint = f"{url}/rest/v1/amenity_detail"
    params = {
        "airport_code": "eq.SIN",
        "select": "id,name,amenity_slug,description,terminal_code,airport_code,vibe_tags,price_level,opening_hours,booking_required,available_in_tr,brand_family,is_flagship",
        "limit": "1000",
    }

    print(f"Fetching amenities from {url}...")
    resp = requests.get(endpoint, headers=headers, params=params)

    if resp.status_code != 200:
        print(f"ERROR: HTTP {resp.status_code}")
        print(resp.text[:500])
        sys.exit(1)

    amenities = resp.json()
    print(f"Got {len(amenities)} amenities")

    # Verify terminal distribution
    from collections import Counter
    terminals = Counter(a.get("terminal_code", "?") for a in amenities)
    print(f"Terminal distribution: {dict(terminals)}")

    # Check for brand_family and is_flagship fields
    has_brand = sum(1 for a in amenities if a.get("brand_family"))
    has_is_flagship = sum(1 for a in amenities if a.get("is_flagship"))
    print(f"With brand_family: {has_brand}")
    print(f"With is_flagship: {has_is_flagship}")

    # Write to file
    output_path = "amenities_db.json"
    with open(output_path, "w") as f:
        json.dump(amenities, f, indent=2)

    print(f"\nWritten to {output_path}")
    print(f"File size: {os.path.getsize(output_path) / 1024:.1f} KB")


if __name__ == "__main__":
    export_amenities()
