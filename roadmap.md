## Publish hero artwork, fee row and comparison live

- [x] Publish so the hero payout-network artwork, the "One 2% fee" step in the capability row and the How it works comparison go live on lamportpay.com (owner, 19 Oct 2026)
- [x] Verify on lamportpay.com and lamportpay.lovable.app: hero artwork loads at full resolution (1024x1536); all eight capability steps share one horizontal line (same vertical centre) with "One 2% fee" last and Live, Identity check and Local currency payout still Sandbox; /how-it-works shows "The difference" and "The result" with eight table rows; no sideways scrolling, no browser errors
- [ ] Confirm this batch is in the company GitHub repository (git state is managed outside this editor; nothing was pushed from here)

## Publish this batch live

- [x] Publish so the People page order and "Izzat Iftikhar", the How it works comparison section and the one-complaint-per-chat fix go live (owner, 19 Oct 2026)
- [x] Verify on lamportpay.com: card order Zoaib Ali, Ghazanfar Abbas, Izzat Iftikhar, Zaheer Muneer, Safi Ullah Adam, Greg Mirt; comparison section present on /how-it-works and the homepage; live chat code saves every reply under one conversation id (fresh id only on "New chat")
- [ ] Confirm this batch is in the company GitHub repository (git state is managed outside this editor; nothing was pushed from here)


## Team member full name

- [x] Show the marketing & community member as "Izzat Iftikhar" on the People page (owner, 19 Oct 2026)
- [x] Verify the card and open profile show the full name at desktop and phone widths


## Team card order


- [x] Show the People page cards in the owner's order: Zoaib Ali, Ghazanfar Abbas, Izzat, Zaheer Muneer, Safi Ullah Adam, Greg Mirt
- [x] Verify the card order at 1280px, 871px and 390px; build OK

## Greg Mirt profile wording

- [x] Replace his role, description and focus areas with the owner's supplied card text; remove the previous physiotherapy-practice description
- [x] Verify his team card, advisor filter and full profile panel on desktop and phone: role, new description and all five focus pills present, no Experience section, none of the old wording; other advisors' Experience sections still render; build OK

## Greg Mirt team profile


- [x] Add Greg as Advisor with a matching portrait and screenshot-sourced skills
- [x] Verify his team card, advisor filter and full profile at 1280px and 390px; hosted portrait returns image/jpeg, no overflow or browser errors, latest build OK. Local browser image check uses the hosted image because localhost does not serve the asset gateway.

## Reference-style connected infographic

- [x] Replace the logo stations with grouped asset cards, routing, liquidity, raised KYC branch and connected settlement/payout stages
- [x] Verify at 1536px, 1280px, 871px and 390px: no overflow, all logos loaded, seven moving paths, pause/resume and reduced motion; no browser errors and latest build OK. Refund explicitly planned/disabled; preview only.

## Logo-led motion flow

- [x] Replace static hub and selectors with a screen-fitting connected logo journey and viewport-gated motion
- [x] Verified at 1280px, 871px and 390px: seven measured connections, moving tokens, pause/play, reduced motion, all logos loaded, no overflow or browser errors; build OK

## Compact payment-flow replacement

- [x] Replace rejected tree with assets → settlement → currencies overview and manual eight-step details; preserve other sections and financial behavior
- [x] Verified manual step selection at 1280px, 871px and 390px; all logos load, no horizontal overflow or browser errors, preview build OK

## Infrastructure ecosystem replacement

- [x] Match eight reference columns with separate USDT/USDC/BNB rows, candidate DEX/network groups, payout/FX/recipient checklists and benefits; retain accurate planned/sandbox qualifications
- [x] Verify 1536px, 1280px, 699px and 390px: all columns fit, animated tokens move, enlarge/fit and pause/resume work, reduced motion honored, no page overflow or runtime errors; preview build OK
- [x] Replace old connected-systems section with branching assets, verification, routing, settlement and payout ecosystem
- [x] Animate token movement on measured connections; preserve sandbox/planned labels and all financial behavior
- [x] Verify at 1280px, 699px and 390px: token movement, pause/resume, reduced motion, all images loaded, no horizontal overflow or page errors; preview build OK

## Map gestures and integration timeline

- [x] Enable bounded touch drag, pinch zoom, wheel zoom and consistent map controls
- [x] Replay integration fade-up and connected snake timeline on viewport entry, with reduced-motion support
- [x] Verify phone touch drag/pinch and desktop drag/wheel, zoom/reset, timeline entry/exit replay, no page overflow or browser errors

## Done: Mobile hero actions and capability row

- [x] Hero's two action buttons stay on one swipeable row on phones instead of stacking
- [x] "All in one" capability strip shows as one swipeable row on phones; the grid returns at 700px and wider
- [x] Hero's coin/flag strip (SOL · USDC → USD GBP INR PHP) stays on one swipeable row on phones instead of wrapping to two lines; both ends fade so the swipe is obvious and the last item is never hidden
- [x] Verified at 390px, 360px and 1280px: one row on phones, even grid on desktop, no page overflow, no page errors, build OK

# Roadmap

## Mode wording: Devnet / Sandbox

- [x] Rename the customer-facing mode name from "TEST MODE" / "TESTNET / DEMO MODE" to "DEVNET / SANDBOX" in the site notice, hero, journeys, docs, compliance, white paper, workflow, payment page, admin labels and server messages
- [x] Keep the server's own mode key, limits, error codes and endpoint guards untouched; LIVE MODE keeps its name so real funds stay unmistakable
- [x] Verify every public page shows the new wording with none of the old labels left, no page errors, typecheck clean and 524 unit tests passing

## Homepage navigation and accessibility

- [x] Expose desktop navigation and visible Open App action; retain mobile drawer
- [x] Add persistent demo notice and integrate currencies into the hero
- [x] Improve flow hover/focus feedback and number/connector contrast
- [x] Verify at 1268/820/390/360px: desktop links, mobile Docs drawer, manual Jupiter selection and keyboard focus, persistent notice, Open App → /pay, no page errors or horizontal overflow; preview build OK

## Interactive payout map and hero summary

- [x] Make the world map clickable country by country with smooth zoom, plus/minus and reset controls, and a card showing the selected country's flag, name and status
- [x] Keep Nigeria and Pakistan as planned markets in amber, show other countries by name only, and remove the green ticks from the map
- [x] Replace the country row under the banner with one compact card: crypto in (SOL, USDC) to local money out as currency symbols
- [x] Verify a country click zooms correctly with no page errors and no horizontal overflow at phone and desktop sizes
- [ ] Automatic checks on the newest commit: the run reached lint and stopped there — a pre-existing type problem in the Ask AI chat admin file (an `any` the lint rules reject) fails it on every recent commit. Fixed in that file (typed like the other admin files) and lint, type checks and all 509 unit tests pass locally; the fix reaches GitHub on the next sync, which re-runs every check on the current copy.


## Manual homepage content navigation

- [x] Remove automatic content changes and play/pause from explanatory journeys; put content above step selectors with opposite-corner previous/next controls
- [x] Verify manual selection and stable reading after waiting beyond the old timer, at 411px and 1280px; no page errors or horizontal overflow, latest build OK

## Mobile homepage polish

- [x] Compact the mobile hero and align homepage sections, diagrams, map and controls while preserving desktop presentation
- [x] Verify at 360px/411px and desktop: menu → Docs, bank switching, roadmap controls, calculator → /pay handoff, no page errors or horizontal overflow; animated map scroll stable and latest build OK

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
- [x] Automatic sync of this fix to GitHub (on main; the working copy and main match, verified 14 Oct 2026)

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

## Early-access fee waiver enforced

- [x] First 10 early-access signups pay no LamportPay fee: the waiver is decided server-side from the signup list (matched by the wallet that joined, or the account email)
- [x] Quote, settlement plan, swap sizing, calculator and payment view all price a waived payment at zero LamportPay fee; payout partner and network costs unchanged
- [x] Every waived payment records why and which place in line earned it; pricing stays frozen once quoted
- [x] Joining from the launch popup records the connected wallet; admin shows wallet, place in line and whether each free place has been used
- [x] Verify: typecheck clean, 508 unit tests pass, build OK, signed-in calculator still quotes 2% for a non-listed account with the new waiver field present
- [x] Both fee lines browser-verified on /pay: a normal account shows "LamportPay fee 4.00 USDC" on 200 USDC; an account on the list shows "LamportPay fee Waived (early access)" with the full amount converted. The list entry used for that check was a temporary row, removed afterwards (list back to 0 signups, fee back to 2%)

## Homepage: connected payment journey section removed

- [x] "One connected payment journey / From your wallet to their bank." section removed from the homepage, not replaced: wallet / LamportPay / Jupiter → USDC / Stables / bank account route panel, the sandbox panel, the vertical flow graphic and every label, note and control inside it
- [x] Section component and its now-unused animation styles deleted; nothing else on the page touched (capabilities, banks, calculator, infrastructure, corridors, news, banner all unchanged)
- [x] Verify: typecheck clean, 508 unit tests pass; browser check on desktop (1280px) and mobile (390px) — section absent from the DOM, bank-destinations and payout-calculator sections now sit flush with a single divider and no empty gap
