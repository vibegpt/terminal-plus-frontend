# statedMinutes contract (CC-29 A3, APPENDIX 4)

nowSgt is minutes since midnight, Singapore time.

| Query | nowSgt | Expected |
|---|---|---|
| is the butterfly garden a 5 min walk? | 13:00 | null |
| Cheers in T3 is open 24 hours | 13:00 | null |
| which lounge is 10 minutes from gate B5? | 13:00 | null |
| I have 2 hours | 13:00 | 120 |
| I've got 45 minutes | 13:00 | 45 |
| we have an hour and a half before boarding | 13:00 | 90 |
| 3 hour layover, what should I do | 13:00 | 180 |
| boarding at 14:30 | 13:00 | 90 |
| my flight is at 3am | 23:00 | 240 |
| I have 30 hours | 13:00 | null |
| SQ322 gate B5 | 13:00 | null |
| I have 2 mins | 13:00 | null |
| I have 2 hours, is the lounge a 10 min walk? | 13:00 | 120 |
| I have 1 hour 20 minutes | 13:00 | 80 |
| I've got time, is it a 10 min walk? | 13:00 | null |
| 45 minutes until boarding, coffee? | 13:00 | 45 |
| I have half an hour | 13:00 | 30 |

## Amendment (Todd, 12 Nov 2026): "in N hours"
Found by chat eval n11 ("In about 2.5 hours. Where should I eat?" answers "when does your flight board?"; the 17 rows returned null). A duration counts after `in` / `within` at the start of the message, or after `boarding|boards|flight|departs|leaves|leaving|gate closes (is) in`.

| Query | nowSgt | Expected |
|---|---|---|
| In about 2.5 hours. Where should I eat? | 13:00 | 150 |
| boarding in 45 minutes | 13:00 | 45 |
| my flight leaves in 2 hours | 13:00 | 120 |
| is Cheers open in 2 hours? | 13:00 | null |
| the lounge is in 10 minutes walk | 13:00 | null |
| what is open in about 3 hours? | 13:00 | null |
