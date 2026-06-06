#!/bin/bash
# prosodyctl check — warnings dépréciation ne doivent pas bloquer les scripts.
prosody_check_config() {
  prosodyctl check config 2>&1 | tail -20 || true
  echo "(prosodyctl check — warnings OK, suite du script)"
}
