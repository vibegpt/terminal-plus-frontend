#!/usr/bin/env python3
"""
Migrate amenity images from temporary Google Places URLs to Supabase Storage.
- Reads amenities from Supabase with a logo_url containing 'googleapis.com'
- Downloads each image
- Uploads to 'amenities' bucket in Supabase Storage
- Updates logo_url in the database to the permanent Supabase CDN URL
"""

import os
import time
import requests

SUPABASE_URL = "https://bpbyhdjdezynyiclqezy.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwYnloZGpkZXp5bnlpY2xxZXp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTQ5OTQxMiwiZXhwIjoyMDYxMDc1NDEyfQ.X1zo8WOB11FdwCiQdX18i38lU6SMzTouOT-KE_1CjIE"
BUCKET_NAME = "amenities"
TABLE_NAME = "amenity_detail"

HEADERS = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json"
}

def fetch_amenities_with_google_urls():
    """Fetch all amenities where logo_url is a Google Places URL."""
    url = f"{SUPABASE_URL}/rest/v1/{TABLE_NAME}"
    params = {
        "select": "id,amenity_slug,name,logo_url",
        "airport_code": "eq.SIN",
        "logo_url": "like.*googleapis.com*"
    }
    resp = requests.get(url, headers=HEADERS, params=params)
    resp.raise_for_status()
    return resp.json()

def download_image(url):
    """Download image from URL, return bytes and content-type."""
    resp = requests.get(url, timeout=15)
    resp.raise_for_status()
    content_type = resp.headers.get("Content-Type", "image/jpeg")
    # Normalize content type
    if "jpeg" in content_type or "jpg" in content_type:
        ext = "jpg"
        mime = "image/jpeg"
    elif "png" in content_type:
        ext = "png"
        mime = "image/png"
    elif "webp" in content_type:
        ext = "webp"
        mime = "image/webp"
    else:
        ext = "jpg"
        mime = "image/jpeg"
    return resp.content, mime, ext

def upload_to_supabase(slug, image_bytes, mime_type, ext):
    """Upload image to Supabase Storage, return public URL."""
    filename = f"{slug}.{ext}"
    upload_url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{filename}"
    
    upload_headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": mime_type,
        "x-upsert": "true"  # overwrite if exists
    }
    
    resp = requests.post(upload_url, headers=upload_headers, data=image_bytes)
    
    if resp.status_code not in (200, 201):
        raise Exception(f"Upload failed: {resp.status_code} {resp.text}")
    
    # Return the public CDN URL
    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{filename}"
    return public_url

def update_logo_url(amenity_id, new_url):
    """Update logo_url in the database."""
    url = f"{SUPABASE_URL}/rest/v1/{TABLE_NAME}"
    params = {"id": f"eq.{amenity_id}"}
    payload = {"logo_url": new_url}
    
    patch_headers = {**HEADERS, "Content-Type": "application/json", "Prefer": "return=minimal"}
    resp = requests.patch(url, headers=patch_headers, params=params, json=payload)
    resp.raise_for_status()

def main():
    print("Fetching amenities with Google Places URLs...")
    amenities = fetch_amenities_with_google_urls()
    print(f"Found {len(amenities)} amenities to migrate\n")
    
    success = 0
    failed = []
    
    for i, amenity in enumerate(amenities):
        slug = amenity.get("amenity_slug") or f"amenity-{amenity['id']}"
        name = amenity.get("name", slug)
        logo_url = amenity["logo_url"]
        
        print(f"[{i+1}/{len(amenities)}] {name} ({slug})")
        
        try:
            # Download
            image_bytes, mime_type, ext = download_image(logo_url)
            
            # Upload to Supabase
            new_url = upload_to_supabase(slug, image_bytes, mime_type, ext)
            
            # Update DB
            update_logo_url(amenity["id"], new_url)
            
            print(f"  ✅ Migrated → {new_url}")
            success += 1
            
        except Exception as e:
            print(f"  ❌ Failed: {e}")
            failed.append({"id": amenity["id"], "name": name, "error": str(e)})
        
        # Small delay to be respectful to Google's API
        time.sleep(0.3)
    
    print(f"\n{'='*50}")
    print(f"✅ Success: {success}/{len(amenities)}")
    if failed:
        print(f"❌ Failed: {len(failed)}")
        for f in failed:
            print(f"  - {f['name']}: {f['error']}")

if __name__ == "__main__":
    main()
