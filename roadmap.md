# Roadmap

## In progress: Import GitHub main (GhazanfarGw/lamportpay) into Lovable

- [x] Fetch GitHub main (34b44ea) and compare with Lovable copy (6360a50)
- [x] Overlay GitHub files (353) into project; keep Lovable glue (.env, .lovable, supabase auto-gen, MCP, error-capture, routeTree)
- [x] Delete 69 superseded Lovable-only files
- [ ] bun install to sync bun.lock with GitHub package.json
- [ ] Merge server.ts: GitHub security headers + Lovable abort handling (499)
- [ ] Run full test suite
- [ ] Apply team DB migrations (20260926..20261007) to Lovable Cloud
- [ ] Regenerate types.ts after migrations
- [ ] Reconcile regressions in shared files (Stables-only currencies, capability labels, multi-asset messaging, 2% fee wording, Circle compliance section)
- [ ] Verify pages load (/, /send, /swap, /pay, /blog, /compliance, /docs, /workflow, /whitepaper, /contact)
- [ ] Update AGENTS.md; push to GitHub
