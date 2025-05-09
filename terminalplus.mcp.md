# Terminal+ MCP (Model Context Protocol)
_Last updated: 2025-05-06_

## 🔷 Project Overview
Terminal+ is a mobile-first web application that transforms the "dead time" in international airport terminals into a personalized, mood-driven experience.

It uses:
- **Supabase** for backend (DB, Auth, Edge Functions)
- **Vercel** for frontend hosting (React/Next.js)
- **Cursor + ChatGPT** for AI-assisted development
- **Vibe Engine** to adapt UI and suggestions based on emotional state

---

## 🛠 Stack
| Layer         | Tool        | Purpose                       |
|---------------|-------------|-------------------------------|
| Frontend      | React + Vercel | UI / navigation / real-time app |
| Backend       | Supabase    | DB, Auth (email + TikTok), Edge Functions |
| DB Layer      | Supabase Postgres | Stores user journey data |
| Edge Logic    | Supabase Edge Functions | `saveJourney`, soon `getJourneys` |
| AI Tooling    | Cursor + ChatGPT | Code generation, refactoring, architecture |

---

## 🧱 Database: `journeys` Table

| Column           | Type            | Notes |
|------------------|-----------------|-------|
| id               | uuid (PK)       | Auto-generated ID |
| flight_number    | text            | E.g. "SQ308" |
| origin           | text            | E.g. "SIN" |
| destination      | text            | E.g. "LHR" |
| transit          | text (nullable) | Optional layover |
| selected_vibe    | text            | "Relax", "Explore", etc. |
| departure_time   | timestamptz     | UTC |
| user_id          | uuid (nullable) | Linked to `auth.users.id` (future) |
| inserted_at      | timestamptz     | Default: `now()` in UTC |

### RLS Policies
- ✅ Anonymous inserts allowed (`anon` role, `with check (true)`)
- ❌ Updates restricted unless user auth is enabled

---

## 💡 Vibe Modes
Terminal+ adapts user experience based on selected mood:

- **Relax** → Lounges, spas, quiet zones
- **Explore** → Dining, shopping, art
- **Work** → Fast Wi-Fi, desks, charging stations
- **Quick** → Fast food, minimal queues
- **Comfort** → Calm lighting, smooth navigation

---

## 🔁 Edge Function: `saveJourney`

- Method: `POST`
- Location: `supabase/functions/saveJourney/index.ts`
- Reads request body:
```ts
{
  flight_number: string,
  origin: string,
  destination: string,
  transit?: string,
  selected_vibe: string,
  departure_time: string (ISO)
}