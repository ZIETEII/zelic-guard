# ZELIC Guard — Demo Script

Target length: **2:40–2:55**. The public YouTube video must remain under three minutes and include spoken audio.

## Before recording

- Deploy the exact commit linked in the submission.
- Configure `OPENAI_API_KEY` and `OPENAI_MODEL=gpt-5.6` in Vercel if live model compilation will be shown.
- Compile once and confirm the UI badge says **GPT-5.6 live**. If it says **Deterministic fallback**, do not claim that the live request used GPT‑5.6.
- Reset the lab, close unrelated tabs, use a 1440×900 or larger viewport, and verify there are no console errors.
- Do not include copyrighted music, third-party marks, private keys, email inboxes, or payment data.

## Spoken walkthrough

### 0:00–0:18 — Hook

> “AI agents can plan freely. But at execution time, they should act only inside authority a human explicitly approved. This is ZELIC Guard: intent contracts for AI agents.”

Show the top of the mission-control screen and the **Simulation only** disclosure.

### 0:18–0:30 — Optional identity boundary

> “The judge sandbox stays open. This optional operator path adds a real server-validated session without a database, private data, or third-party auth.”

Open **Operator login**, select **Use demo credentials**, sign in, and show the **Operator workspace** badge.

### 0:30–0:52 — Compile intent

> “A natural-language request is compiled server-side by GPT‑5.6 into a strict typed contract. Every model-produced field is validated with Zod. When credentials are absent, the same judge path uses an honest deterministic fallback.”

Select **Compile contract**. Point to the visible compiler badge.

### 0:52–1:12 — Human authority

> “The model can propose, but it cannot authorize itself. A human reviews the action, recipient, cost ceiling, expiry, run limit, resource fingerprint, and the SHA‑256 authority fingerprint before approval.”

Scroll through the contract and select **Approve contract**.

### 1:12–1:48 — One-click threat suite

> “Now I challenge all five boundaries through the real server evaluation route.”

Select **Run full threat suite**.

> “The exact approved attempt is allowed. Recipient drift, cost overrun, replay, and expiration are denied. Every attempt evaluates ten rules in a fixed order and returns machine-readable reason codes.”

Show the 1 ALLOW / 4 DENY report, one failed check, and the counters.

### 1:48–2:10 — Deterministic evidence

> “Time and replay history are explicit inputs. The policy engine is pure and framework-independent, so identical validated inputs produce identical evidence. The lab never sends an email, makes a payment, or mutates a third party.”

Show the ordered checks, contract JSON, and audit timeline.

### 2:10–2:34 — Developer tool

> “Developers integrate through three validated guard endpoints: compile, approve, and evaluate. The public sandbox needs no login, and the repository includes sample data, 100-plus tests, a five-minute judge plan, and complete Build Week provenance.”

Show **Integrate in three requests** and the live API curl example.

### 2:34–2:52 — Codex and GPT‑5.6

> “Codex and GPT‑5.6 helped turn the brief into the architecture, test-first implementation, security review, responsive product, and verification trail. GPT‑5.6 structures intent; the deterministic guard—not the model—owns execution authority.”

End on the completed threat-suite report and repository URL.

## Final recording checklist

- Duration is below 3:00.
- Audio clearly says how Codex and GPT‑5.6 were used.
- The project shown matches the submitted deployment and repository.
- The video is publicly visible on YouTube.
- The first 15 seconds state the problem and product.
- The ALLOW and DENY outcomes are legible without pausing.
