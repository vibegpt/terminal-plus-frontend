# Review Sync Fix — Terminal-Aware Place Lookups

Date: 2026-07-07 · Commit: `fix(sync): terminal-aware place lookups, no parent fallback` (not pushed)

## Discovery: what resolve-place-ids.ts was

The sync is a **two-stage pipeline**:

1. **`scripts/resolve-place-ids.ts`** (was untracked, "one-time script") — **the contaminator**. Query text was already terminal-aware (`"{name} Changi Airport Terminal 3"`), but line 56 blindly took `results[0].place_id` from legacy Places Text Search with zero validation. Failure modes: (a) *one id per brand* — Google ranks the brand's most prominent Changi listing first regardless of terminal words (proven: the "Din Tai Fung" query for every terminal returns "Din Tai Fung @ Jewel"); (b) *parent fallback* — shops with no listing got the airport/Jewel listing itself, which really does appear in results (denylist hits below); (c) *no validation* — returned name/address never compared to the row.
2. **`api/cron/sync-reviews.ts`** (Vercel cron, Mondays 03:00 SGT, Places v1 Details, `GOOGLE_MAPS_API_KEY`) — faithful stage 2: writes rating/count/highlight for whatever id it's given. Not the bug; **untouched**. It skips null-id rows, so the 193 cleaned rows were never at risk from the cron — only from a stage-1 re-run, which is what this fix makes safe.

Only these two files write the five review columns.

## Design as built (`scripts/resolve-place-ids.ts`, rewritten in place — old version deleted)

- Places API **v1** `searchText` (same key as the cron; legacy API retired with the old code), field mask id/displayName/formattedAddress, 250 ms rate limit, 5 candidates per row.
- **Gates (all must pass, else next candidate; none pass → NO_MATCH):**
  1. Denylist: `ChIJw3l-FL4X2jERw2pScvHQCbg` (Changi overall, the 97k contaminator), `ChIJmSWWF4082jERIWnmIGTljBQ` (SilverKris incident id), plus parent-name pattern (`^(Singapore )?Changi Airport$|^Jewel Changi…`).
  2. Terminal tokens in displayName+address — explicit map incl. street numbers + postcodes (`T1: terminal 1|t1|80 airport|819642` … `JEWEL: jewel|78 airport|819666`), with a **cross-terminal veto** (naming another terminal without ours = hard reject).
  3. Name similarity: noise-token-stripped containment or Jaccard ≥ 0.5, logged per candidate.
  4. Cross-terminal uniqueness at write time (DB + in-run): a place_id may live in only one terminal_code; same-terminal chain sharing still allowed.
- **Honest failure**: NO_MATCH rows stay all-NULL and land in `needs_manual_place_id` (in the run report). Never a parent, sibling terminal, or guess.
- **Modes**: default = null-id rows only (idempotent/incremental). `--dry-run` writes nothing, prints full table. `--validate-existing` = report-only regression of rows that have ids (never nulls/reassigns). `--slugs`, `--limit` selectors. Every run writes `tasks/place-id-resolve-run.md` (decision + per-candidate gate log).
- Script only writes `google_place_id`; review data stays with the cron (pipeline separation preserved).

## Regression: 25 kept rows (dry-run, --validate-existing)

**23/25 VALID with their existing ids — zero churn.** Tuning applied during this stage: added street-number/postcode tokens after Zara Jewel failed on a bare "78 Airport Blvd" address. Two report-only failures, both correct behavior:

- `butterfly-garden-t3-new` — Google's listing address is a generic "70 Airport Blvd, 819661" with no terminal signal; strict gates can't verify (row keeps its data; validate mode never writes).
- `hermes-t3` — **finding**: the kept id's own address says **Terminal 1**. The audit kept it on review-text evidence ("Hermès T3 outlet"), but the listing appears to be the T1 store. Added to manual review; consider nulling this row's review data by hand.

## The 10-row dry-run (approved before live)

| Slug | Term | Decision | Evidence |
|---|---|---|---|
| singapore-airlines-silverkris-lounge-t1-new | T1 | NO_MATCH | **denylist blocked the original incident id**; T2/T3 SilverKris + KrisFlyer listings all `wrong_terminal_token`; no T1 listing exists |
| sunny-hill-jewel | JEWEL | NO_MATCH | no own listing |
| kinokuniya-jewel-new | JEWEL | NO_MATCH | downtown main store `no_terminal_token`; **"Jewel Changi Airport" blocked by denylist**; Wonder Store `name_mismatch` |
| din-tai-fung-jewel-new | JEWEL | **ASSIGNED** | "Din Tai Fung @ Jewel", jaccard 1.0 — the brand's single listing is genuinely the Jewel one |
| din-tai-fung-t3-new | T3 | NO_MATCH | same Jewel listing rejected `wrong_terminal_token` (cross-terminal veto) |
| lotte-duty-free-wines-spirits-t3-level-2-37 | T3 | **ASSIGNED** | "Lotte Duty Free (T3 Arrival)", 819663 |
| birds-in-flight-sint3 | T3 | NO_MATCH | art installation, no listing |
| butterfly-garden-t1-new | T1 | NO_MATCH | T3's garden listing rejected — no cross-terminal borrow |
| the-singapore-mint-jewel | JEWEL | NO_MATCH | denylist blocked Jewel parent; Mint's candidates are downtown stores |
| muji-t3-new | T3 | NO_MATCH | "MUJI (Jewel Changi Airport)" `wrong_terminal_token` |

## Post-write verification (live run on the 10, after approval)

- Live results identical to dry-run: `assigned=2, needs_manual=8`.
- SQL: the 2 rows carry their new ids (ratings null — cron fills Monday); NO_MATCH rows still fully null.
- **Contamination audit re-run: zero place_ids shared across different terminals, table-wide.**
- Build + adversarial 10/10 after all changes. `git status`: only the rewritten script + run report + this file.

## needs_manual_place_id format

Every run appends a `## needs_manual_place_id` section to `tasks/place-id-resolve-run.md`: `- slug (terminal) "name" — NO_MATCH(reason)`. Current list from the live run: the 8 rows above. Expect a high NO_MATCH rate on the full run — that is the design (honest null beats borrowed data); most obscure Changi shops have no own Google listing.

## Proposed schema guard (NOT applied — awaiting separate approval)

Cross-terminal uniqueness needs an exclusion constraint (not expressible as a partial unique index):
```sql
create extension if not exists btree_gist;
alter table amenity_detail add constraint amenity_place_id_one_terminal
  exclude using gist (google_place_id with =, terminal_code with <>)
  where (google_place_id is not null);
```
Code-level enforcement is active regardless.

## Flags / follow-ups

- **Full-table run NOT executed** — awaits your separate go (`npx tsx scripts/resolve-place-ids.ts --dry-run` first, review, then live).
- `hermes-t3` kept id is suspect (listing address = T1) — manual decision.
- Optional defense-in-depth: add the denylist check to `api/cron/sync-reviews.ts` (out of scope, untouched).
- Portability note: script sets `dns ipv4first` + disables happy-eyeballs — required on IPv4-only networks where undici hangs on Google's AAAA records; harmless elsewhere.
