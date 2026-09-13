#!/usr/bin/env bash
# Mobile overflow sweep — routes x viewports x repetitions
# Usage: bash scripts/mobile_sweep.sh <base_url> [reps]
set -u
BASE="${1:-http://localhost:3000}"
REPS="${2:-3}"
ROUTES=(/ /notices /payments /request /login /signup /terms /profile /forgot-password /reset-password /admin /admin/members /admin/payments /admin/notices /admin/broadcast /admin/content /admin/schedule /admin/stats)
VIEWPORTS=(320 390 414)
FAIL=0

for rep in $(seq 1 "$REPS"); do
  for vpw in "${VIEWPORTS[@]}"; do
    agent-browser set viewport "$vpw" 844 >/dev/null
    for r in "${ROUTES[@]}"; do
      agent-browser open "$BASE$r" >/dev/null 2>&1
      agent-browser wait --load networkidle --timeout 20000 >/dev/null 2>&1
      agent-browser wait 1200 >/dev/null 2>&1
      OUT=$(agent-browser eval "document.documentElement.scrollWidth - document.documentElement.clientWidth" 2>/dev/null)
      OUT="${OUT//\"/}"
      if [ "$OUT" != "0" ]; then
        echo "REP$rep vw=$vpw $r OVERFLOW=${OUT}px  <-- FAIL"
        FAIL=1
      fi
    done
    echo "REP$rep vw=$vpw : sweep done"
  done
done
if [ "$FAIL" -eq 0 ]; then echo "SWEEP RESULT: ALL CLEAN (0px overflow, ${REPS} reps x ${#VIEWPORTS[@]} viewports x ${#ROUTES[@]} routes)"; else echo "SWEEP RESULT: OVERFLOW DETECTED"; fi
exit $FAIL
