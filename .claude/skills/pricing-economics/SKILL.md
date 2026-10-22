---
name: pricing-economics
description: Analyse or decide Suqya prices, discounts, renewals, payment fees, teacher pay, staff cost, marketing budget or margins. Use whenever the owner asks about price per hour, plans, offers, teacher salary rules, payment gateways or profitability. Starts from the recorded reference instead of repeating research.
---

# Suqya pricing economics

## 1. Start from the record, never from scratch
1. Read `docs/PRICING_ECONOMICS.md` first (in this repository). It holds the AS-IS price,
   the market benchmark, cost inputs, unit economics, the decision log and
   "Mistakes not to repeat".
2. Read the AS-IS price from `index.html` (pricing section) and the pricing block of
   `assets/app.*.js` only if the question depends on an exact current value.
3. Repeat market research only if the question needs it or the benchmark is older
   than 6 months; record the new date and sources.

## 2. Analyse
- Separate AS-IS (live price), TO-BE (owner decision) and PROPOSED (your recommendation).
- Use the recorded inputs; label anything new as ASSUMPTION until the owner confirms it.
- Compute with a script (`node -e ...`), never by hand, and show the result table.
  Always cover: full price, the largest billing discount and the largest family
  discount, with the international card fee.
- Check every proposal against the guardrails in section 4 of the reference:
  teacher pay at most 40% of the net hourly price, minimum effective price,
  break-even, maximum acquisition cost.
- Check every proposal against the fixed rules:
  - no price, discount or billing change ships without explicit owner approval;
  - teacher pay never rewards the number of hours the teacher recommends or teaches
    (trial recommendations follow learner need);
  - ask whether a tier applies to all hours or only the hours above the threshold;
  - pay changes need measurable criteria; a failed review freezes pay, it does not cut it.
- Give one recommendation, with the numbers that justify it and what stays unverified.

## 3. Keep the record current (do not ask the owner to remember)
Update `docs/PRICING_ECONOMICS.md` in the same piece of work whenever, and only when:
- the owner gives a new input (cost, fee, rate, budget) — update section 3;
- the owner decides something — add a dated DECIDED row to the log, and mark any row
  it replaces as superseded (never leave two live versions);
- a recommendation is made that the owner has not yet decided — add a PROPOSED row;
- a mistake or a dead end is found — add it to "Mistakes not to repeat".
Do not log ordinary questions or restate analysis that is already recorded.
Commit on a focused branch and open or update a Draft PR; a docs-only change needs no deployment.

## 4. Reply to the owner
Arabic, short, phone-friendly: decision first, then the table, risks, what is unverified,
and the single decision needed from the owner.
