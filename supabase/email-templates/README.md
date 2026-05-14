# EstateMotion — Branded Email Templates

These HTML templates replace Supabase's default plain-text emails so users
get a consistent EstateMotion-branded experience from signup through
password reset. Without installing them, Supabase sends generic
"Confirm your signup" emails that look like phishing and undermine trust.

## Files

| File | Supabase template | When sent |
|---|---|---|
| `confirm-signup.html` | **Confirm signup** | Right after a user creates an account. Required to activate the account. |
| `reset-password.html` | **Reset Password** | When a user clicks "Forgot password?" |
| `magic-link.html` | **Magic Link** | If we ever enable passwordless sign-in. Branded for consistency. |
| `email-change.html` | **Change Email Address** | When a user changes the email on their account. |

## How to install (one-time, ~5 minutes)

1. Open the [Supabase Dashboard](https://supabase.com/dashboard) and pick the
   EstateMotion project.
2. Go to **Authentication → Email Templates** in the left nav.
3. For each template above:
   - Click the corresponding template name in the dashboard.
   - Replace the **Subject** with the recommended subject below.
   - Open the matching `.html` file in this folder, copy the entire contents,
     and paste into the **Message (HTML)** body.
   - Click **Save**.

### Recommended subjects

| Template | Subject |
|---|---|
| Confirm signup | `Confirm your EstateMotion account` |
| Reset Password | `Reset your EstateMotion password` |
| Magic Link | `Your EstateMotion sign-in link` |
| Change Email Address | `Confirm your new EstateMotion email` |

## Sender address

While you're in **Authentication**, also configure:
- **Project Settings → Auth → SMTP Settings** — point to a real SMTP
  provider (Resend, Postmark, SendGrid). Without this, Supabase sends from
  `noreply@mail.app.supabase.io` which lands users in spam and shows
  "via supabase.io" in Gmail. You want `noreply@estatemotion.ai`.
- The **Sender name** field — set to `EstateMotion` (not `Supabase Auth`).

## Placeholders

Supabase substitutes these tokens at send time:

- `{{ .ConfirmationURL }}` — the magic link the user clicks
- `{{ .Email }}` — the recipient's email
- `{{ .NewEmail }}` — only available in the email-change template
- `{{ .SiteURL }}` — your project's configured site URL
- `{{ .Token }}` — 6-digit OTP fallback (we don't display it)

## Design system

All four templates share:
- **Brand:** EstateMotion logo (gradient gold E + wordmark) in a top stripe.
- **Palette:** paper `#0E0E10`, surface `#15151A`, edge `#2A2A30`,
  ink `#E8E2D6`, gold `#C7A76C`, gold-light `#D4B96A`.
- **Typography:** system stack (`-apple-system`, `BlinkMacSystemFont`, etc.),
  with monospace eyebrow labels in the body.
- **Card layout:** 560px max-width, dark surface, rounded corners,
  generous padding so the email looks designed, not transactional.
- **Mobile-first:** all widths flex below 560px, font sizes legible at
  inbox preview pane size.

## Testing

After installing, trigger each email manually:
- **Signup confirm:** create a brand-new test account.
- **Reset:** click "Forgot password?" on the auth screen with that account's email.
- **Magic link:** Supabase Dashboard → Authentication → Users → row → "Send magic link".
- **Email change:** in the app's Settings screen (or directly via API), change the email and watch the inbox.

Send each to at least one Gmail and one Apple Mail inbox to confirm the
dark-card design renders correctly. Outlook is also worth a check —
its email renderer drops some CSS gracefully but the table layout above
is built to survive it.
