# SSH + fail2ban (applied on VPS)

Effective settings (`/etc/ssh/sshd_config.d/99-mcbuleli-harden.conf`):

- `PermitRootLogin prohibit-password` (clé uniquement)
- `PasswordAuthentication no`
- `AuthenticationMethods publickey`
- `AllowTcpForwarding` — historically `no` (blocks `ssh -L`). For Remix tunnel ops, set `yes` or remove the line (OpenSSH default is yes).
- fail2ban jail `sshd` (ban 1h after 4 fails / 10m)

Verify:

```bash
sshd -T | grep -E 'passwordauthentication|permitrootlogin|allowtcpforwarding'
fail2ban-client status sshd
```

Enable local port forward (Remix tunnel) without weakening password auth:

```bash
sed -i 's/^AllowTcpForwarding no/AllowTcpForwarding yes/' /etc/ssh/sshd_config.d/99-mcbuleli-harden.conf
sshd -t && systemctl reload ssh
sshd -T | grep allowtcpforwarding
```

Recovery: console/provider VNC if you lose the SSH key.
