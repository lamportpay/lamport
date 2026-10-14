# Roadmap

## Commercial homepage refresh

- [x] Add sourced bank restrictions, integration-status overview and pending Colosseum submission; verified official deposit-warning scope, source link, desktop/mobile labels, no overflow or page errors and build OK
- [x] Animate Payment route, Bank destinations and Connected systems with sequenced flows, spotlight panels and accessible playback; verified desktop/mobile autoplay, controls, reduced motion and no page errors or overflow
- [x] Explain Web3 verification compactly in infrastructure and in detail on Workflow using shared content; retain How it works for customer steps
- [x] Polish automatic partner slider with pause/reduced-motion behavior and correct Wharf Street Studios to India
- [x] Verify public verification links, autoplay, pause and layouts at desktop/phone sizes; no page errors or overflow, latest build OK
- [x] Polish future assets and markets with compact icons and Nigeria / NGN alongside Pakistan
- [x] Replace detailed partner cards with an accessible official-logo slider; official AGC wordmark and Great Winchester crest added
- [x] Add an animated connected-system tree with Hyperliquid explicitly planned and disabled; verified desktop/mobile interactions, no overflow/page errors, reduced motion respected
- [x] Improve real asset icons, present Pakistan / PKR as a planned market, and refresh partner logo presentation including Great Winchester Investment Company (six companies; logos load, desktop/mobile no errors or overflow)
- [x] Verify deeper gradient ring motion, reduced-motion behavior and the planned currency outlook beneath bank destinations (desktop/mobile, no overflow, build OK; exact future fiat currencies remain unconfirmed)
- [x] Replace crowded homepage sections with a concise business overview and animated payment workflow
- [x] Show bank branding, accurate infrastructure roles, business partners and transparent costs
- [x] Move assistant help to a bottom-right support panel; verify workflow selection, bank country switching and support answers on desktop/mobile (no page errors or overflow; hosted asset service used for local logo verification)

## Admin dashboard organization

- [x] Organize the shared admin menu and page sections; preserve existing access checks and financial actions
- [x] Add overview metrics, attention queue, payment status breakdown, searchable recent payments and system activity
- [x] Verify isolated desktop/phone presentation, payment filters and menu navigation; four unit checks pass
- [ ] Verify dashboard with real admin records (available preview session has no admin role; no permissions changed)

## Bank field and mobile navigation

- [x] Match the bank selector to input height and left-align names (form flow requires a connected wallet for end-to-end verification)
- [x] Add official-site bank branding to 178 listed bank names; keep neutral icons where a verified logo is unavailable
- [x] Replace the mobile website dropdown with a right-side drawer; verified opening, Docs navigation and closing

## Automatic checks green

- [x] Find why the newest commit on GitHub showed a failed check: lint stopped on a platform-generated file
- [x] Exclude that generated file from lint instead of hand-editing it, and limit the browser-bundle secret scan to browser-facing output
- [x] Re-run every check the automatic run performs locally: lint exits 0, no env files or keys tracked, typecheck clean, 498 unit tests pass, production build OK, browser bundle free of private keys, dependency audit clean

## Docs page update

- [x] Replace the outdated stack and planned API surface with current integration documentation
- [x] Explain identity, quote-first checkout, fees, status synchronization and test-mode boundaries
- [x] Verify endpoint references, contents navigation and page rendering; HTTP 200, 18 endpoint rows, no page errors or overflow, build OK

## Compliance page update

- [x] Correct beneficiary payouts, hosted verification and provider responsibilities
- [x] Clarify demo capabilities, security controls and production readiness without claiming certification
- [x] Verify the page and its disclosures in the preview; HTTP 200, no page errors or overflow, build OK

## Whitepaper update

- [x] Align the whitepaper with the shared payment journey, costs and test-mode disclaimer
- [x] Correct architecture, bank-only payouts, verification, supported assets and operational safeguards
- [x] Verify contents navigation, page information and rendering; HTTP 200, no page errors or overflow, build OK

## How it works and workflow pages

- [x] Replace outdated steps and conceptual endpoints with the current quote-first payment journey
- [x] Clarify sandbox verification, simulated payout, fees and non-custodial safeguards on both pages
- [x] Verify both pages, navigation and desktop/mobile layouts in the preview; both return 200, no page errors or overflow, build OK

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
- [x] Owner confirmed Bliss Rent and named Great Winchester Investment Company as the sixth partner; official-site link and brand icon verified

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
- Audit remaining stale claims before the next publish: home copy may claim fast checkout, 24/7, 400ms, 1:1, dynamic "tx/min" rates
- LIVE mode approval (blocks real-funds actions in /pay until given)

## Done: Pay page polish and bank format checks

- [x] GitHub check failure fixed (security advisory in an agent-tools library; updated to the fixed version)
- [x] Example placeholders and format checks for every bank field, per country
- [x] Marketing "Convert" button renamed "Swap" (/pay URL unchanged)
- [x] Mobile app-style polish of /pay first screen
- [x] Bank guidance moved from homepage to Compliance page
- [x] Map scan beam no longer causes page overflow / scroll jumps
