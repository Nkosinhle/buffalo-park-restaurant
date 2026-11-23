# Buffalo Park Restaurant — Next.js website

Responsive restaurant website with original Buffalo Park photos, interactive menu cards, gallery, mobile navigation, directions, social links, and real **reservation-request** submissions.

## Run locally

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open http://localhost:3000. Without configured Supabase credentials, the site displays normally, but reservation submissions return a clear "temporarily unavailable" error rather than giving a fake confirmation.

## Activate real reservation requests

1. **Already completed for this installation:** the protected `reservation_requests` table was created and its RLS protection verified in the Buffalo Lodge Supabase project (`evznljvmcjrrupyumkxl`). Do not rerun the schema unless resetting or using a different project.
2. Open `.env.local` and fill `SUPABASE_URL` and **server-only** `SUPABASE_SECRET_KEY` from Supabase's Settings → API Keys. The new `sb_secret_*` key is recommended; never put it in any `NEXT_PUBLIC_` variable, commit it, or display it publicly. The API inserts records server-side only.
3. Create a [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/get-started/) site for your website and fill `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`. This is required for public booking submissions on a production deployment. Set `PUBLIC_SITE_HOSTNAME` to your production hostname for additional host verification.
4. To receive emails when new requests arrive, register and verify a sending domain with [Resend](https://resend.com/), then set `RESEND_API_KEY`, `BOOKING_FROM_EMAIL`, and `RESTAURANT_BOOKINGS_EMAIL`. These are optional: reservation requests still save to Supabase if email delivery is not configured.
5. Restart `npm run dev`, submit a request, and verify a `pending` row appears in Supabase → Table Editor → `reservation_requests`.
6. Restaurant staff must review and manually change the status from `pending` to `confirmed` or `declined` and **contact the customer**. A submitted request is not a confirmed table.

### Local booking tests (no CAPTCHA)

During local development only, set `ALLOW_UNPROTECTED_BOOKINGS=true` in `.env.local` and leave the Turnstile site key empty. **Never** enable this in production.

## Production deployment to Vercel

1. Connect the GitHub repository to Vercel and choose Next.js.
2. Copy required variables to Vercel **Production** Environment Variables: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` and your hostname in `PUBLIC_SITE_HOSTNAME`. Add the three Resend values if using notifications. Do not add `ALLOW_UNPROTECTED_BOOKINGS` in production.
3. Deploy and test a booking request end-to-end on the production domain. Confirm a pending row in Supabase and a staff notification if configured.
4. Verify operational details with the restaurant: correct contact channels, actual menu/prices, opening hours, reservation handling, policies and photo permissions. Get the restaurant's approval of the `/privacy` notice before public launch.

## Features

- Responsive mobile and desktop layouts; smartphone drawer navigation
- Nine original Buffalo Park photos in menus, venue sections and gallery
- Clickable dishes open detail modal, and CTA opens booking requests
- Full-screen gallery and keyboard next/previous controls
- Interactive contact/address/directions links
- Validation on both client and server, dates in South African local time, guest limits and rate limiting
- Real server-side Supabase insert with private table protected by Row Level Security
- Optional email notifications to staff through Resend
- Cloudflare Turnstile support for anti-bot protection
- Clear *request received* state after successful storage; no false confirmed-reservation promise

## Important safety & operations notes

- Do not treat this as an automatically available table-booking engine. It is a **real request-management workflow** until the restaurant chooses to implement table capacity, schedules, confirmation and staff operations.
- The site intentionally omits an unverified restaurant phone number and unverified menu pricing. Confirm these with management.
- The privacy policy requires the restaurant's final review and business/privacy details before public release.
- The built-in per-process rate limiter is a basic guard, not a cross-instance attack defence; use Turnstile and consider edge-level throttling through your hosting provider for high traffic.
- Guests are not charged or asked to create accounts.

## Setup status (23 Nov 2026)

- Supabase project URL is set in `.env.example` (nonsecret).
- Private reservation table exists, with RLS enabled and no anon/authenticated table grants.
- Database insert was checked inside a rolled-back transaction; no test customer data remains.
- Add the `SUPABASE_SECRET_KEY` **locally and only on the server**. Do not include it in version control.
- Production still needs Turnstile credentials and real restaurant operations approval.

## Uploading this project to GitHub from Windows

Extract all files and open PowerShell in the extracted project folder. Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\publish-to-github.ps1
```

This script pushes the project to `Nkosinhle/buffalo-park-restaurant`, preserving `.gitignore` so `.env.local` and any private credentials are not committed. Authenticate with your own GitHub account when prompted.
