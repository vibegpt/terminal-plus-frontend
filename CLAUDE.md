# Terminal+ Smart7 Ralph Loop

## Quick Start
```bash
cd smart7-eval
# First time only: export amenities from Supabase
export SUPABASE_URL="https://bpbyhdjdezynyiclqezy.supabase.co"
export SUPABASE_KEY="YOUR_ANON_KEY"
python export_amenities.py

# Run the scorer to get baseline
python score_smart7.py --weights weights.json --scenarios eval_scenarios.json --amenities amenities_db.json --verbose
```

## To Start Ralph Loop
Tell Claude Code:
```
Run the Ralph loop using smart7-eval/RALPH_LOOP_PROMPT.md. 
Max 15 iterations. Target RQS > 0.80. 
Log all experiments to smart7-eval/experiments.jsonl.
```

## Project Context
- Project root: `~/Desktop/terminal-plus-frontend/`
- Smart7 eval files: `smart7-eval/` (copy this folder into project root)
- Current weights: `src/config/smart7Weights.ts`
- Engine: `src/lib/SmartRecommendationEngine.ts`
- Supabase project: `bpbyhdjdezynyiclqezy`

## Key Rules
- Scoring script runs pure Python. Zero API cost.
- Claude Code generates weight mutations on subscription quota.
- Selection weights MUST sum to 1.0.
- Change 1-2 params per iteration, not 5.
- Structural fixes > weight tuning. Always.
- After loop completes, update `src/config/smart7Weights.ts` with winning values.
