# Five-Minute Judge Test Plan

## Fastest path: live sandbox

Open [https://zelic-guard-build-week.vercel.app](https://zelic-guard-build-week.vercel.app). No login or API key is required.

1. Select **Compile contract**.
   - Expected: a `PROPOSED` contract appears.
   - Confirm recipient `finance@northstar.test`, max cost `$0.25`, max runs `1`, and SHA‑256 fingerprints.
   - The compiler badge accurately reports `GPT-5.6 live` or `Deterministic fallback`.
2. Select **Approve contract**.
   - Expected: status becomes `APPROVED`; execution controls unlock.
3. Select **Run full threat suite**.
   - Expected: report completes with exactly 1 `ALLOW` and 4 `DENY` outcomes.
   - Expected counters: `Allowed 1 · Blocked 4`.
4. Select or inspect an adversarial result.
   - Recipient drift includes `RECIPIENT_NOT_ALLOWED`.
   - Cost overrun includes `COST_LIMIT_EXCEEDED`.
   - Replay includes `REPLAY_DETECTED` and `MAX_RUNS_EXCEEDED`.
   - Expiry includes `CONTRACT_EXPIRED`.
5. Expand **Authority JSON** and inspect the audit timeline.
   - Expected: strict machine-readable contract data and deterministic ordered events.
6. Select **Reset Lab**.
   - Expected: contract and counters return to the clean initial state.

The application must never claim that an email, payment, or third-party action occurred.

## Optional operator boundary — one additional minute

1. From the public header, select **Operator login**.
2. Select **Use demo credentials**, then **Sign in to workspace**.
   - Expected: `/workspace` loads with an **OPERATOR WORKSPACE** badge.
   - Expected: the guard behavior and simulation disclosure remain unchanged.
3. Select **Sign out**.
   - Expected: the session is expired and `/workspace` redirects back to `/login` until a new valid login.

This account contains only public synthetic demo data. The session proves a real server-side identity boundary; it does not grant external action authority.

## Clean local reproduction

```bash
git clone https://github.com/ZIETEII/zelic-guard.git
cd zelic-guard
npm install
cp .env.example .env.local
npm run test:run
npm run dev
```

Open `http://localhost:3000` and repeat the live path above.

## Full engineering gates

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
```

## Optional GPT‑5.6 path

Set server-only `OPENAI_API_KEY` and `OPENAI_MODEL=gpt-5.6`, restart the server, and compile the seeded intent in `auto` mode. The badge should report `GPT-5.6 live`. Invalid model output fails closed; provider failure in `auto` mode is visibly labeled and falls back only to the seeded deterministic path.
