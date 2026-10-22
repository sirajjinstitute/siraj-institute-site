# Pricing Economics — Reference and Decision Log

Purpose: one place for Suqya pricing, cost and margin analysis, so future pricing
discussions start from recorded facts and decisions instead of repeating the same
research or mistakes. Update this file whenever a pricing input or decision changes.

Status labels: **DECIDED** (explicit owner decision), **PROPOSED** (recommendation
awaiting the owner), **ASSUMPTION** (input not yet confirmed), **UNVERIFIED**.

## 1. Current public price (AS-IS, from `index.html` and `assets/app.*.js`)

- Flat **$14.99 per teaching hour**, one to one; lessons are 30 minutes (=$7.50 a lesson).
- Monthly plans: 2/3/4/5 classes a week = 4/6/8/10 hours = $59.96 / $89.94 / $119.92 / $149.90.
- Billing-period discount: quarterly 5%, semi-annual 10%, annual 15%.
- Family discount by learners: 2 = 10%, 3 = 15%, 4 = 20%.
- Discounts never stack; the larger one wins.
- Free trial lesson, no payment.

## 2. Market benchmark (research 2026-10-15, vendor pages; indicative only)

| Tier | Price per hour | 2×/week 30-min monthly | Examples |
|---|---|---|---|
| Budget | $7–9 | $30–40 | Riwaq ($32), Live Quran Lessons ($39), Quran Oasis ($38), Safdriya ($30), Egypt Institute ($40) |
| Mid / premium | $9–18 | $40–55 | Daan ($9–13), Alif UK (£35–40); typical premium $12–18 |
| Western / advanced tutors | $24–56 | $100+ | US/UK freelance, Superprof, Preply high end |

Conclusion: Suqya sits at the top of the premium band. The justification is the
product (parent portal, ayah-level progress, recordings, weekly story, monthly report,
fixed teacher, reviewed trial summary), not the hourly tutor alone. Competing on
price is a losing strategy; compete on visible value. The most price-sensitive
comparison is the 2×/week plan ($59.96 vs $30–40 ads).

## 3. Cost inputs

| Input | Value | Status |
|---|---|---|
| Teacher pay (current teachers) | $4.5–6 per hour | DECIDED (owner, 2026-10-15) |
| Coordinators + supervisors | ~20,000 EGP / month ≈ $400 at ~50 EGP/USD | ASSUMPTION: monthly total, EGP, exchange rate |
| Marketing | not set | OPEN |
| Payment gateway, local cards | 1.48% + 2 EGP per transaction | owner-supplied quote, 2026-10-21 |
| Payment gateway, international cards | 2.85% + 2 EGP per transaction | owner-supplied quote, 2026-10-21 |
| Payout delay | 3 business days | owner-supplied quote |

Gateway notes (UNVERIFIED until the contract is read): whether VAT is added on the
fee, refund/chargeback fees, settlement currency (EGP vs USD) and the FX spread if
USD prices are charged in EGP. Most families are abroad, so model with the
international rate. 2 EGP ≈ $0.04, negligible per invoice.

## 4. Unit economics (international card, 2.85% + $0.04 per invoice)

Gateway fee per monthly invoice: $59.96 → $1.75; $89.94 → $2.60; $119.92 → $3.46;
$149.90 → $4.31; annual 3×/week $917.39 → $26.19. Net per hour at full price ≈ **$14.56**.

| Effective price/hour | Net after fee | Teacher $4 | Teacher $5 | Teacher $6 |
|---|---|---|---|---|
| $14.99 (base) | $14.56 | 27.5% / $10.56 | 34.3% / $9.56 | 41.2% / $8.56 |
| $12.74 (annual −15%) | $12.38 | 32.3% / $8.38 | 40.4% / $7.38 | 48.5% / $6.38 |
| $11.99 (family 4 −20%) | $11.65 | 34.3% / $7.65 | 42.9% / $6.65 | 51.5% / $5.65 |

Cells are teacher share of net revenue / institute contribution per hour.

Guardrails (PROPOSED):
- Teacher pay ≤ 40% of the net hourly price; at full price that ceiling is ~$5.83.
- Never sell below ~$13.30 effective per hour when the teacher earns $6.
- Break-even on ~$400 staff cost ≈ 45–50 taught hours a month (≈8 students on 3×/week).
- Customer value ≈ 6 h/month × ~$9 × 6 months ≈ $300 contribution; maximum
  acquisition cost ≈ $100 per paying student, ≈ $30 per trial at 30% conversion.

## 5. Decision log

| Date | Topic | Outcome | Status |
|---|---|---|---|
| 2026-10-15 | Hourly price | Keep $14.99 as launch price; do not cut. Revisit after 30–50 trials: >40% trial→paid → raise to $16.99–17.99 for new students only; <20% with price objections → add a smaller entry plan instead of cutting the rate. | PROPOSED |
| 2026-10-15 | Price display | Show per-lesson price ($7.50) next to per-hour, since competitors price per lesson. | PROPOSED |
| 2026-10-15 | Family 4 discount | 20% falls below the safe floor with $6 teachers; option: reduce to 15%. | PROPOSED, owner to decide |
| 2026-10-16 | Renewal | A discount follows its reason: billing-period discount kept only when renewing for the same or longer period; family discount kept while siblings stay enrolled; temporary promotions end with the subscription. | PROPOSED |
| 2026-10-21 | Teacher pay by monthly hours (4 → 5 at 130 h → 6 at 180 h) | Rejected as written: retroactive tiers create pay cliffs, thresholds need 30–42 h/week, and volume pay conflicts with the trial rule that recommended hours follow learner need, not teacher preference. | Superseded by the next row |
| 2026-10-21 | Teacher pay by tenure and quality ($4 start → $5 after one year of commitment and high supervisor ratings → $6 after a second quality year) | Supported, with measurable criteria, an interim 6-month step, grandfathered current teachers and $6 limited to sustained quality. See section 6. | Superseded by the next row |
| 2026-10-22 | Teacher pay by composite teacher score (0–100%) | Pay follows the composite score (supervisor evaluation, commitment, homework assigning, homework review rate and speed, weekly story). Supersedes the LMS 2026-10-04 "no points, ranking or combined grade" line for this score. The teacher sees their own score and its components. Weights 25/25/20/15/15 (supervisor, commitment, homework assigning, review, story), owner update 2026-10-22. Ladder thresholds 75/85/90 with 3/6/12-month minimums confirmed. Shape in section 6. | DECIDED |

## 6. Score-based pay model (2026-10-22)

Composite teacher score, 0–100%, selectable for the current month, last 3, 6, 12, 24
months and all history. Weights (DECIDED 2026-10-22, commitment raised as the most important):

| Component | Weight | Measure (teacher actions only) |
|---|---|---|
| Supervisor evaluation | 25% | average saved score, /35 converted to /100 |
| Commitment | 25% | absences and lateness from existing metrics |
| Homework assigning | 20% | share of completed lessons with homework |
| Homework review | 15% | share of submitted homework reviewed; ≤24 h full credit, 24–48 h half, later zero |
| Weekly story | 15% | share of (student, week with a completed lesson) with a story |

A component with no data in the period is left out and the weights are renormalised,
never counted as zero or as perfect.

| Rate | Condition (DECIDED 2026-10-22) |
|---|---|
| $4 | default, or last-3-month score below 75% |
| $5 | last-3-month score ≥ 75% and at least 3 months of data |
| $5.5 | last-3-month score ≥ 85% and at least 6 months of data |
| $6 | all-history score ≥ 90%, last-3-month ≥ 85% and at least 12 months of data |

- Reviewed quarterly, not monthly. On the admin payroll page, selecting a teacher shows
  a notice when they meet a higher step ("eligible for $X because condition Y"); the
  owner reviews manually and confirms or declines. No automatic pay change.
- The teacher's evaluation page explains, in Arabic, how the score and the pay
  ladder work.
- A drop only after two consecutive quarterly reviews below the threshold.
- Current teachers keep their existing rate ($4.5–6) unless the new rule gives more.
- $6 exceeds the 40% guardrail on discounted plans; acceptable while $6 teachers
  are a minority, review the mix twice a year.
- Supersedes, for this score only, the LMS 2026-10-04 line "no points, ranking or
  combined grade". Audience: active admin and supervisor see every teacher; the
  teacher sees only their own score and components, never other teachers or a ranking.

## 7. Mistakes not to repeat

- Do not assume a 5% payment fee; use the recorded gateway rate.
- Always ask whether a tier applies to all hours (retroactive) or only hours above
  the threshold; retroactive tiers create pay cliffs.
- Do not tie teacher pay to the number of hours the teacher recommends or teaches.
- Market prices from vendor pages are promotional and per-lesson vs per-hour is
  often mixed; convert before comparing.
- No price, discount or billing change ships without explicit owner approval.
