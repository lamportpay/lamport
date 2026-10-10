# Roadmap

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

## Waiting on the owner

- Social accounts: create/confirm X, LinkedIn and GitHub profiles, then send the final URLs so every link (footer, header, contact page) is updated in one pass
- Publish the blog at lamportpay.com, submit the sitemap to Google Search Console, set social share images
- Audit stale claims before the next publish: whitepaper overstates KYC/regulated operations; home copy may claim fast checkout, 24/7, 400ms, 1:1, dynamic "tx/min" rates; compliance says Stables selected but production access pending
- LIVE mode approval (blocks real-funds actions in /pay until given)
