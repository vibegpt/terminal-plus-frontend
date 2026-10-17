# CC-26 submission kit

Every field is ready to paste. Nothing here has been submitted. Submit only after Todd's go, once production runs CC-26 and the registry entry is published.

- Server URL: `https://terminalplus.app/api/mcp` (Streamable HTTP, no auth)
- Docs: `https://terminalplus.app/agents`
- Privacy: `https://terminalplus.app/privacy`
- Support: `terminalplusapp@gmail.com`
- Operator: Todd Byrne
- Icon: `public/icon-512.png` (512×512 PNG, "T+" monogram). Also at `https://terminalplus.app/icon-512.png` once live.
- Registry name: `app.terminalplus/airport-concierge`

---

## 1. Claude connectors directory

**Server name** (100 max)
```
Terminal+ Changi Airport Concierge
```

**One-liner** (200 max)
```
Where to eat, rest and shop at Singapore Changi, with live flight status, delays and layover plans. Changi T1 to T4 and Jewel only. Read-only, no login.
```

**Description** (2,000 max)
```
Terminal+ helps travellers at Singapore Changi Airport (SIN) make the most of their time before a flight or between flights.

Ask where to eat in Terminal 3, somewhere quiet to rest, what's worth seeing with three hours, or whether your flight is delayed. Claude uses Terminal+ to answer with venues from a hand-curated catalogue covering Terminals 1 to 4 and Jewel, each with a link to its page.

What it does:
- Places to eat, rest, shop, work and explore, filtered by terminal, mood and the time you have.
- Live flight status: terminal, gate, estimated boarding time and minutes until boarding.
- Delays, cancellations and gate changes, with what to do next.
- Layover plans: an ordered set of stops with how long each takes and a buffer for gate security.

It follows the airport's realities: venues that are closed right now are left out, and landside venues such as Jewel are only suggested when there's time to clear immigration and come back.

Limits: Singapore Changi only. It never books, buys or changes anything. No account or API key needed.
```

**Categories**
```
Travel, Lifestyle
```

**Use cases**
```
- "I'm in T3 with 2 hours before boarding. Where should I eat?"
- "Is SQ322 delayed, and which gate is it at?"
- "I land at T1 on QF1 and have 3 hours before my connection. Plan it."
- "Somewhere quiet to nap near my gate at T2."
- "Is there time to visit Jewel on a 5-hour layover?"
```

**What users need first**
```
Nothing. No account, no API key, no sign-in.
```

**Reads or writes**
```
Reads only. All 4 tools are read-only (readOnlyHint: true, destructiveHint: false).
```

**Company / developer**
```
Todd Byrne
```

**Support contact**
```
terminalplusapp@gmail.com
```

**Documentation URL**
```
https://terminalplus.app/agents
```

**Privacy policy URL**
```
https://terminalplus.app/privacy
```

**Icon**
```
public/icon-512.png (512×512 PNG)
```

**Data handling**
```
Venue answers come from Terminal+'s own hand-curated catalogue of Changi venues. Flight status comes from a third-party flight-data service (AeroDataBox), which the server queries on the user's behalf with only the flight number and date; results are cached for up to 5 minutes. Each request logs the tool name, the arguments the assistant sent (for example a terminal, a mood or a flight number), a short summary of the result and its latency. No conversation text, account, name, email, IP address or browser details are stored. Details: https://terminalplus.app/privacy
```

---

## 2. ChatGPT apps

**Name**
```
Terminal+ Changi Airport Concierge
```

**Description**
```
Places to eat, rest and shop at Singapore Changi (Terminals 1 to 4 and Jewel), live flight status and delays, and layover plans. Read-only; no login.
```

### Tool annotations

| Tool | readOnlyHint | destructiveHint | openWorldHint | Why |
|---|---|---|---|---|
| `get_recommendations` | true | false | false | Reads Terminal+'s own venue catalogue; changes nothing and calls no outside service. |
| `get_route` | true | false | false | Builds a plan from Terminal+'s own route templates and catalogue; changes nothing. |
| `get_airport_context` | true | false | true | Reads live flight data from an outside flight-data service; changes nothing. |
| `get_disruption_status` | true | false | true | Reads live flight data from an outside flight-data service; changes nothing. |

### Test prompts and expected outputs

Flight answers depend on the day's schedule; the expected output describes what must be present, not exact values.

1. **"I'm at Changi Terminal 3 with about 2 hours before boarding. Where can I get something to eat?"**
   Tool: `get_recommendations` (terminal `SIN-T3`, vibe `refuel`, time_until_boarding_minutes ≈ 120).
   Expected: a short list of venues that are open now, each with name, terminal, a one-line note and a `https://terminalplus.app/amenity/…` link. No landside venues (with under 180 minutes and the passenger type unknown, landside places are left out).

2. **"Is flight SQ322 from Singapore delayed? Which gate?"**
   Tool: `get_disruption_status` (and possibly `get_airport_context`), flight_number `SQ322`.
   Expected: the flight's status (for example "Expected" or "Delayed"), terminal (SIN-T3) and gate if assigned, whether there is a disruption, and a suggested action. If there's a long delay, it says whether there's time for Jewel.

3. **"When do I need to board QF1 today, and how long do I have?"**
   Tool: `get_airport_context`, flight_number `QF1`.
   Expected: terminal SIN-T1, scheduled departure, estimated boarding time and minutes until boarding as a positive number when the flight is later today, plus an urgency level.

4. **"I land at Changi T1 on QF1 and have 4 hours before my connection. Plan my time."**
   Tool: `get_route` (arrival_terminal `SIN-T1`, time_budget_minutes 240, flight_number `QF1`).
   Expected: an ordered list of stops (food, a garden or attraction, shopping) with minutes per stop, venue links, and a final 15-minute "walk to gate + security" buffer. Landside stops carry the label "Landside: clear immigration both ways (visa rules apply)".

5. **"What's good to do at Heathrow Terminal 5?"**
   Tool: none needed, or `get_recommendations` / `get_airport_context`.
   Expected: the assistant explains that Terminal+ covers Singapore Changi only. A flight that doesn't touch Changi returns `flight_not_found` with "Terminal+ covers Singapore Changi Airport (SIN) only."

---

## 3. mcp.so

- **Name:** Terminal+ Changi Airport Concierge
- **One-line description:** Places to eat, rest and shop at Singapore Changi, live flight status and layover plans. Read-only, no auth.
- **URL:** https://terminalplus.app/api/mcp
- **Docs:** https://terminalplus.app/agents
- **Tags:** travel, airport, singapore, changi, flights, layover, remote, streamable-http

## 4. awesome-mcp-servers (PR)

- **Section:** Travel & Transportation
- **README line:**
```
- [vibegpt/terminal-plus-frontend](https://github.com/vibegpt/terminal-plus-frontend) 📇 ☁️ - Singapore Changi Airport concierge: places to eat, rest and shop across T1 to T4 and Jewel, live flight status and delays, and layover plans. Remote, read-only, no auth: `https://terminalplus.app/api/mcp`.
```
- **PR title:** `Add Terminal+ (Singapore Changi Airport concierge)`
- **Tags:** travel, airport, singapore, flights
