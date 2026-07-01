# q7 Pricing — decision record & implementation spec

> Decided 2026-07-01 with the v31 720p COGS pivot. Supersedes q6 ($49/$99).
> Annual prices deliberately DO NOT change. Draft reviewed before touching Stripe.

## The model

| SKU | Price | Includes | Notes |
|---|---|---|---|
| Pro monthly | **$69/mo** (was $49) | 5 credits/mo | most popular |
| Pro annual | **$490/yr** (unchanged) | 5 credits/mo | = $41/mo eff, **41% off monthly** |
| Studio monthly | **$149/mo** (was $99) | 10 credits/mo | |
| Studio annual | **$990/yr** (unchanged) | 10 credits/mo | = $83/mo eff, **45% off monthly** |
| Overage credit | **$12** | 1 credit | subscribers only, any quantity |
| Pay-as-you-go | **$39** (unchanged) | 1 credit | no subscription |

**Credit = one 30s video. A 60s video = 2 credits** (already enforced —
`renderCreditsFor()` in `api/render.js` since v26.5). First video free (trial), unchanged.

**Retired SKUs:** `single` ($100), `pack5` ($375), `pack10` ($650) — $65–75/video
relics of the $100/video era. Slugs now 400 gracefully. Overage replaces bulk packs.

## Why (margin math @ v31 COGS)

v31 COGS per credit: $5.70–6.90 (30s, 9 scenes, 720p buckets); 60s ≈ $11–12 (2 credits cover it).
Worst case = full utilization, all-30s at the investor track's $6.90:

- Pro monthly: $69 − $34.50 = **+$34.50** (50%)
- Pro annual eff: $40.83 − $34.50 = **+$6.33** — thin but never a loss → the annual
  guardrail holds even for the rare heavy annual user; typical annual utilization
  (~50–60%, gym pattern) yields ~$20+.
- Studio monthly: $149 − $69 = **+$80** (54%) · Studio annual eff: $82.50 − $69 = **+$13.50**
- Overage: $12 − $6.90 = 43% · payg: $39 − $6.90 = 82%

Every tier profitable at any usage → $20k/mo profit needs **~400 paying users**
(vs ~1,300 under q6 at 1080p COGS).

## Rationale (from the strategy work)

Raising monthly makes full-utilization months profitable; annual under-utilizers are
cheap to serve, so holding annual at $490/$990 creates a 41–45%-off pull that locks
cash + retention (churn fragility fix). Agents don't price-shop (Reel-E thrives at
~15× the cheapest competitor). Overage caps the downside without capping revenue.

## Implementation (this commit)

- `api/create-checkout-session.js` — fix `resolvePriceForTier` duplicate-declaration
  SyntaxError (**pre-existing launch blocker: every checkout 500'd**); packs now
  `payg` + `overage` only; overage is gated to active pro/studio and accepts
  `quantity` 1–10.
- `webapp/src/components/PaywallModal.tsx` — $69/$149, per-plan annual savings
  (41%/45%), overage row for subscribers, 60s=2credits small print.
- `webapp/src/components/PlanStatusBanner.tsx` — $49 → $69 copy.
- `webapp/src/lib/api.ts` — `CheckoutTier`: +`overage`, −`single/pack5/pack10`.
- `api/stripe-webhook.js` — comment refresh (quotas unchanged: 5/10).
- `supabase/migrations/24_q7_pricing.sql` — `tier_plans.price_cents` 6900/14900;
  `get_user_tier_state` reason copy ($100-era strings → $39 payg / $12 overage).

## Stripe dashboard steps (Troy — after push)

1. Products → **Pro** (`prod_UnjP2x6bU76sCR`) → Add price: $69/mo recurring →
   set as **default price**. Copy id → Vercel env `STRIPE_PRICE_PRO_MONTHLY`.
2. Products → **Studio** (`prod_UnjRqWSQ0zJd4m`) → Add price: $149/mo recurring →
   default. Copy id → `STRIPE_PRICE_STUDIO_MONTHLY`.
3. **Archive** the old $49 and $99 monthly prices (existing subs, if any, keep them).
4. Verify `STRIPE_PRICE_PRO_YEARLY` / `STRIPE_PRICE_STUDIO_YEARLY` are set on Vercel —
   annual checkout has NO product fallback and 400s without them.
5. Run migration 24 in Supabase SQL editor.
6. Redeploy Vercel (env changes don't auto-redeploy) → real test purchase (launch
   checklist) — monthly Pro, annual Pro, payg, and one overage buy.

No webhook changes needed: overage grants credits through the existing
`grant_render_credits` metadata path, same as payg.
