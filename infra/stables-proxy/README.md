# Stables fixed-IP proxy

`setup-stables-proxy.sh` turns a fresh Ubuntu 24.04 server into the forward proxy that gives
LamportPay's Stables calls one fixed outbound IP for Stables' production allowlist.

Current server, tests, limits and operations: `docs/integrations/stables-fixed-ip.md`
("Server created (7 Nov 2026)").

- Contains no secrets. The proxy password is loaded separately with
  `sudo htpasswd -i -c /etc/squid/passwords lamportpay` (password on stdin, never on the command line).
- Run as root: `sudo bash setup-stables-proxy.sh`.
- The app uses it through `STABLES_PROXY_URL` (`src/lib/stables/proxy.server.ts`).
