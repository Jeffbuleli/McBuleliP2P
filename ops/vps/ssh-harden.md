# SSH + fail2ban (applied on VPS)

Effective settings (`/etc/ssh/sshd_config.d/99-mcbuleli-harden.conf`):

- `PermitRootLogin prohibit-password` (clé uniquement)
- `PasswordAuthentication no`
- `AuthenticationMethods publickey`
- fail2ban jail `sshd` (ban 1h after 4 fails / 10m)

Verify:

```bash
sshd -T | grep -E 'passwordauthentication|permitrootlogin'
fail2ban-client status sshd
```

Recovery: console/provider VNC if you lose the SSH key.
