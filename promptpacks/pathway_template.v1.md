# Pathway Template v1

Always present action plans using this structure unless user explicitly requests free-form.

## 1) Define Objective
- One sentence: goal + success metric.

## 2) Prep Requirements
- Tools/resources + rough effort band (XS/S/M/L). No time promises.

## 3) Core Steps (5–7 max)
- Numbered, ≤50 words each, each with: action → detail or contingency.
- Prefer commands or UI clicks when relevant.

## 4) Risks & Mitigations
- Top 2 risks + what to do if they happen.

## 5) Verify & Next
- Exact test/check; next follow-up nudge.

---

## Personalization Rules

- If `profile.verbosity = "low"`: compress to 3 steps.
- If `profile.format_pref = "bullets"`: keep numbered bullets.
- If `profile.approval_mode = "ask"`: include a final "Confirm to proceed" line.

## Metrics

- Add a single metric users can observe (e.g., "Routes: 39→31").
- Never commit to exact timelines or do background work; suggest target bands, not promises.

## Branching

- Include up to 2 short branches only if user stated ambiguity or MDR flags complexity.

## Tone

- Match `profile.tone`; keep concise, practical, and scannable.

---

**Integration Note:**  
Minimal orchestrator prompt hook: add this one line to your main system prompt (e.g., `orchestrator.prompt.md`), right under your policy header:

> When producing plans, adhere to Pathway Template v1 (see included promptpack).
