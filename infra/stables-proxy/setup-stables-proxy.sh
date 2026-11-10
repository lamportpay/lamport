#!/usr/bin/env bash
# LamportPay Stables fixed-IP forward proxy (Oracle Always Free, Ubuntu 24.04).
# Allows only HTTPS CONNECT to the Stables API hosts, only with the proxy password.
# TLS stays end to end between the app and Stables: the proxy never sees the API key.
# Run as root on the server. The password file is filled separately (htpasswd -i).
set -euo pipefail

PORT=3129

export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get install -y -q squid apache2-utils unattended-upgrades iptables-persistent

cat > /etc/squid/squid.conf <<EOF
# Managed by LamportPay infra/stables-proxy/setup-stables-proxy.sh
http_port ${PORT}

auth_param basic program /usr/lib/squid/basic_ncsa_auth /etc/squid/passwords
auth_param basic realm lamportpay-stables
auth_param basic children 2
acl authed proxy_auth REQUIRED

acl stables_hosts dstdomain api.stables.money api.sandbox.stables.money
acl tls_port port 443
acl CONNECT method CONNECT

http_access deny !CONNECT
http_access deny !tls_port
http_access deny !stables_hosts
http_access allow authed
http_access deny all

# No caching, no client details passed on, no version banner.
cache deny all
forwarded_for delete
via off
httpd_suppress_version_string on
visible_hostname lamportpay-proxy

# Access log: time, client, method, host, status, bytes (no bodies; CONNECT is encrypted).
logformat lp %ts %>a %rm %ru %>Hs %<st
access_log daemon:/var/log/squid/access.log lp
EOF

touch /etc/squid/passwords
chown root:proxy /etc/squid/passwords
chmod 640 /etc/squid/passwords

# Host firewall: allow the proxy port (the OCI security list must allow it too).
if ! iptables -C INPUT -p tcp -m state --state NEW -m tcp --dport ${PORT} -j ACCEPT 2>/dev/null; then
  iptables -I INPUT 5 -p tcp -m state --state NEW -m tcp --dport ${PORT} -j ACCEPT
fi
netfilter-persistent save

# Automatic security updates.
dpkg-reconfigure -f noninteractive unattended-upgrades

squid -k parse
systemctl enable squid
systemctl restart squid
systemctl is-active squid
echo "proxy ready on port ${PORT}"
