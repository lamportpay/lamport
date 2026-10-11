# Roadmap

## Done: Homepage demo video

- [x] Add the 60-second walkthrough video to the homepage, between the transfer simulator and the route preview
- [x] Keep it click-to-play with sound, labelled DEMO · TEST MODE, with the payout quote screen as the cover
- [x] Draw the simulator's country flags from /public/flags instead of emoji, so they render on every desktop OS
- [x] Verify the panel, cover, play button and flags in the preview; typecheck clean, 495 unit tests pass, build OK

## Future exploration update

- [x] Separate existing Solana / Jupiter integration from planned additional cryptocurrencies, Hyperliquid and provider APIs
- [x] Present Circle and Tether as future partnership opportunities, not confirmed relationships
- [x] Share expanded future plans between homepage and whitepaper; preserve timeline animation and demo safeguards
- [x] Verify six future exploration items and five animated phases on the homepage, shared details on the whitepaper, build OK and no page errors

## Partner positioning

- [x] Describe confirmed businesses as ready to adopt LamportPay's payment services, not live integrations or payout providers
- [x] State that discussions with additional businesses are underway for future onboarding
- [x] Correct company country groups: Wharf Street Studios USA, Secure Ledger Solutions UK, AGC Global Logistics UAE
- [ ] Confirm the sixth partner's identity and whether the rental company is Bliss Rent or Vessel Rent (waiting on owner)

## Done: Public roadmap refresh

- [x] Replace internal sign-off language with clear public milestones, without changing launch safeguards
- [x] Add phase icons and a connected timeline with reduced-motion support
- [x] Verify five phases, viewport-entry animation, reduced motion, small-screen timeline width and shared whitepaper wording; no page errors

## Done: Import GitHub main (GhazanfarGw/lamportpay) into Lovable

- [x] Fetch GitHub main and overlay its 353 files into the project; keep Lovable glue (.env, .lovable, Supabase auto-gen, MCP routes, error-capture, routeTree)
- [x] Delete 69 superseded Lovable-only files
- [x] Apply team DB migrations (20260926..20261007) to Lovable Cloud; regenerate types.ts
- [x] Reconcile standing rules in shared files (Stables-only demo currencies, capability labels, multi-asset messaging, 2% fee wording, Circle compliance section)
- [x] Verify pages load (/, /send, /swap, /pay, /blog, /compliance, /docs, /workflow, /whitepaper, /contact, /sitemap.xml); /send and /swap redirect to /pay by design
- [x] Push to GitHub (6129dd3, now on main under 20bf4b5)

## Done: Build fix — agent (MCP) endpoints

- [x] Declare `@lovable.dev/mcp-js` in package.json and bun.lock (the project's code used it, but the dependency was missing after the import, so the site could not be built)
- [x] Production build OK; typecheck clean; 489 unit tests pass; agent endpoints respond (protected, 401 without a sign-in; public info endpoint 200)
- [ ] Automatic sync of this fix to GitHub (still waiting; it is the only difference left between the working copy and main)

## Done: Partners section — agent

- [x] Partners listed as one flat grid (no country grouping, no country label on cards); countries shown only in a "Partners in" flags box above the grid
- [x] Flags drawn as inline SVG (USA/UK/UAE) so they render on every desktop OS; typecheck clean, 0 page errors, section verified in the preview
- [x] GitHub sync reconnected (11 Oct 2026) — pending backlog (through "Updated sandbox badges") should push on the next sync event

## Waiting on team input

- Social accounts: create/confirm X, LinkedIn and GitHub profiles, then send the final URLs so every link (footer, header, contact page) is updated in one pass
- Publish the blog at lamportpay.com, submit the sitemap to Google Search Console, set social share images
- Audit stale claims before the next publish: whitepaper overstates KYC/regulated operations; home copy may claim fast checkout, 24/7, 400ms, 1:1, dynamic "tx/min" rates; compliance says Stables selected but production access pending
- LIVE mode approval (blocks real-funds actions in /pay until given)
