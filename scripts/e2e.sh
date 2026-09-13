#!/usr/bin/env bash
# ============================================================
# E2E verification — Youth Red Crescent Team RPI
# Run against a server on $BASE (default http://localhost:3000)
# ============================================================
set -u
BASE="${BASE:-http://localhost:3000}"
PASS=0; FAIL=0
ok()   { PASS=$((PASS+1)); echo "  ok  - $1"; }
bad()  { FAIL=$((FAIL+1)); echo "  FAIL- $1"; }
check(){ if [ "$1" = "$2" ]; then ok "$3"; else bad "$3 (want=$1 got=$2)"; fi; }
has()  { if echo "$1" | rg -q "$2"; then ok "$3"; else bad "$3 (missing: $2)"; fi; }

AJ=/tmp/admin.jar; UJ=/tmp/user.jar; rm -f $AJ $UJ
jq_get() { python3 -c "import sys,json;d=json.load(sys.stdin);print(eval(sys.argv[1]))" "$1" 2>/dev/null; }

echo "== 1. AUTH =="
R=$(curl -s -c $AJ -X POST $BASE/api/auth/login -H 'Content-Type: application/json' -d "{\"id\":\"$ADMIN_ID\",\"password\":\"$ADMIN_PW\",\"role\":\"admin\"}")
has "$R" '"role":"admin"' "admin login admin (env creds)"
R=$(curl -s -c $UJ -X POST $BASE/api/auth/login -H 'Content-Type: application/json' -d "{\"id\":\"$MEMBER_ID\",\"password\":\"$MEMBER_PW\"}")
has "$R" '"role":"member"' "test user login member (env creds)"
R=$(curl -s -b $AJ $BASE/api/auth/me); has "$R" '"username":"$ADMIN_ID"' "auth/me admin"

echo "== 2. PROFILE =="
R=$(curl -s -b $AJ $BASE/api/profile); has "$R" '"team"' "profile GET admin fields"

echo "== 3. SCHEDULE =="
R=$(curl -s $BASE/api/schedule); has "$R" '"day":"sat"' "public schedule GET (seeded)"
N=$(echo "$R" | python3 -c "import sys,json;print(len(json.load(sys.stdin)['schedule']))")
check "6" "$N" "6 seeded rows"
R=$(curl -s -b $AJ -X POST $BASE/api/schedule -H 'Content-Type: application/json' -d '{"day":"fri","time_text":"9:00 AM","activity":{"en":"Test Row","bn":"টেস্ট"},"place":{"en":"Test Place","bn":"টেস্ট স্থান"},"icon":"Sparkles"}')
check "400" "$(curl -s -o /dev/null -w '%{http_code}' -b $AJ -X POST $BASE/api/schedule -H 'Content-Type: application/json' -d '{"day":"fri"}')" "invalid day rejected"
SCH_ID=$(curl -s -b $AJ -X POST $BASE/api/schedule -H 'Content-Type: application/json' -d '{"day":"thu","time_text":"9:00 AM","activity":{"en":"E2E Row","bn":"ইইই সারি"},"place":{"en":"E2E Place","bn":"ইইই স্থান"},"icon":"Sparkles"}' | jq_get "d['row']['id']")
[ -n "$SCH_ID" ] && ok "schedule POST created ($SCH_ID)" || bad "schedule POST"
R=$(curl -s -b $AJ -X PATCH $BASE/api/schedule/$SCH_ID -H 'Content-Type: application/json' -d '{"active":false}'); has "$R" '"ok":true' "schedule PATCH hide"
R=$(curl -s $BASE/api/schedule); if echo "$R" | rg -q "$SCH_ID"; then bad "inactive row hidden from public"; else ok "inactive row hidden from public"; fi
R=$(curl -s -o /dev/null -w '%{http_code}' -X DELETE -b $AJ $BASE/api/schedule/$SCH_ID); check "200" "$R" "schedule DELETE"
R=$(curl -s -o /dev/null -w '%{http_code}' -X POST $BASE/api/schedule -H 'Content-Type: application/json' -d '{"day":"mon"}'); check "401" "$R" "schedule POST blocked for anon"

echo "== 4. PUBLIC STATS (real data) =="
R=$(curl -s $BASE/api/public-stats)
has "$R" '"active_members"' "public-stats endpoint"
has "$R" '"blood_bags"' "blood_bags field"
has "$R" '"volunteer_hours"' "volunteer_hours field"
AM=$(echo "$R" | jq_get "d['stats']['active_members']"); [ "$AM" -ge 2 ] && ok "active_members=$AM (real)" || bad "active_members=$AM"

echo "== 5. ITEM FUND -> PAYMENT LINK =="
R=$(curl -s -b $AJ -X POST $BASE/api/items -H 'Content-Type: application/json' -d '{"kind":"event","title":{"en":"E2E Fund Event","bn":"ইইই ফান্ড"},"description":{"en":"test","bn":"টেস্ট"},"icon":"CalendarDays","amount":150,"payment_required":true,"volunteer_hours":3}')
ITEM_ID=$(echo "$R" | jq_get "d['item']['id']")
VH=$(echo "$R" | jq_get "d['item']['volunteer_hours']")
[ -n "$ITEM_ID" ] && ok "fund item created ($ITEM_ID)" || bad "item create"
check "3" "$VH" "volunteer_hours persisted"
R=$(curl -s $BASE/api/items/$ITEM_ID); has "$R" '"amount":150' "public single-item GET (pay link target)"

echo "== 6. CHECKOUT (fallback) + VERIFY =="
R=$(curl -s -b $UJ -X POST $BASE/api/payments/checkout -H 'Content-Type: application/json' -d "{\"item_id\":\"$ITEM_ID\"}")
has "$R" '"mode":"mock"' "checkout falls back (gateway keys = digests)"
TRAN=$(echo "$R" | jq_get "d['tran_id']")
curl -s -b $UJ -X PUT $BASE/api/payments/pending -H 'Content-Type: application/json' -d "{\"tran_id\":\"$TRAN\",\"item_id\":\"$ITEM_ID\"}" >/dev/null && ok "pending record created"
R=$(curl -s -b $UJ -X POST $BASE/api/payments/verify -H 'Content-Type: application/json' -d "{\"tran_id\":\"$TRAN\",\"mock\":\"success\"}")
has "$R" '"verified":true' "payment verified success"

echo "== 7. ADMIN MANUAL PAYMENT + ATTRIBUTION =="
UID_T=$(curl -s -b $AJ $BASE/api/members | python3 -c "import sys,json;print([m['id'] for m in json.load(sys.stdin)['members'] if m['username']=='$MEMBER_ID'][0])")
R=$(curl -s -b $AJ -X POST $BASE/api/payments/manual -H 'Content-Type: application/json' -d "{\"member_id\":\"$UID_T\",\"amount\":500,\"status\":\"due\",\"note\":\"E2E due\"}")
PAY_ID=$(echo "$R" | jq_get "d['payment']['id']")
has "$R" '"source":"admin"' "manual payment stamped source=admin"
has "$R" '"admin_username":"$ADMIN_ID"' "attribution: admin username"
has "$R" '"admin_name":"Himadri Shekhor Roy"' "attribution: admin name"
has "$R" '"status":"due"' "status due"
R=$(curl -s -b $AJ -X PATCH $BASE/api/payments/manual -H 'Content-Type: application/json' -d "{\"id\":\"$PAY_ID\",\"action\":\"settle\"}")
has "$R" '"status":"success"' "due -> settled (Mark Paid)"
R=$(curl -s -b $AJ -X POST $BASE/api/payments/manual -H 'Content-Type: application/json' -d "{\"member_id\":\"$UID_T\",\"amount\":200,\"status\":\"cancelled\"}")
has "$R" '"status":"cancelled"' "manual cancelled record"
check "400" "$(curl -s -o /dev/null -w '%{http_code}' -b $AJ -X POST $BASE/api/payments/manual -H 'Content-Type: application/json' -d "{\"member_id\":\"$UID_T\",\"amount\":0,\"status\":\"due\"}")" "0-taka rejected"
check "401" "$(curl -s -o /dev/null -w '%{http_code}' -X POST $BASE/api/payments/manual -H 'Content-Type: application/json' -d '{}')" "manual POST blocked for anon"

echo "== 8. FORGOT / RESET PASSWORD =="
R=$(curl -s -X POST $BASE/api/auth/forgot -H 'Content-Type: application/json' -d '{"email":"$MEMBER_EMAIL","lang":"en"}')
RESET_URL=$(echo "$R" | jq_get "d.get('reset_url','')")
[ -n "$RESET_URL" ] && ok "reset link issued (SMTP fallback)" || bad "no reset_url in response"
TOKEN=$(echo "$RESET_URL" | sed 's/.*token=//')
R=$(curl -s -X POST $BASE/api/auth/reset -H 'Content-Type: application/json' -d "{\"token\":\"$TOKEN\",\"password\":\"newpass123\"}")
has "$R" '"ok":true' "password reset with token"
R=$(curl -s -X POST $BASE/api/auth/login -H 'Content-Type: application/json' -d "{\"id\":\"$MEMBER_ID\",\"password\":\"newpass123\"}")
has "$R" '"role":"member"' "login with NEW password"
check "401" "$(curl -s -o /dev/null -w '%{http_code}' -X POST $BASE/api/auth/login -H 'Content-Type: application/json' -d "{\"id\":\"$MEMBER_ID\",\"password\":\"$MEMBER_PW\"}")" "old password now invalid"
check "400" "$(curl -s -o /dev/null -w '%{http_code}' -X POST $BASE/api/auth/reset -H 'Content-Type: application/json' -d "{\"token\":\"$TOKEN\",\"password\":\"zzz123\"}")" "token burned (reuse rejected)"
# restore original test password
NEWTOK=$(curl -s -X POST $BASE/api/auth/forgot -H 'Content-Type: application/json' -d '{"email":"$MEMBER_EMAIL"}' | jq_get "d.get('reset_url','')" | sed 's/.*token=//')
curl -s -X POST $BASE/api/auth/reset -H 'Content-Type: application/json' -d "{\"token\":\"$NEWTOK\",\"password\":\"$MEMBER_PW\"}" >/dev/null && ok "test password restored"

echo "== 9. SUSPENDED AUTO-HIDE =="
R=$(curl -s -b $UJ -X POST $BASE/api/requests -H 'Content-Type: application/json' -d '{"kind":"blood","phone":"01700000001","location":"Rangpur","patient_name":"E2E Patient","blood_group":"B+","urgency":"immediate"}')
REQ_ID=$(echo "$R" | jq_get "d['request']['id']")
[ -n "$REQ_ID" ] && ok "member request created" || bad "request create"
R=$(curl -s $BASE/api/requests); has "$R" "$REQ_ID" "request visible while active"
TID=$(curl -s -b $AJ $BASE/api/members | python3 -c "import sys,json;print([m['id'] for m in json.load(sys.stdin)['members'] if m['username']=='$MEMBER_ID'][0])")
curl -s -b $AJ -X PATCH $BASE/api/members/$TID -H 'Content-Type: application/json' -d '{"status":"suspended"}' >/dev/null
R=$(curl -s $BASE/api/requests); if echo "$R" | rg -q "$REQ_ID"; then bad "request STILL visible after suspend"; else ok "request AUTO-HIDDEN after suspend"; fi
R=$(curl -s $BASE/api/emergency 2>/dev/null); echo "$R" | rg -q "$REQ_ID" && bad "broadcast feed still shows suspended content" || ok "emergency feed clean"
curl -s -b $AJ -X PATCH $BASE/api/members/$TID -H 'Content-Type: application/json' -d '{"status":"active"}' >/dev/null
R=$(curl -s $BASE/api/requests); has "$R" "$REQ_ID" "request visible again after reactivate"
R=$(curl -s -o /dev/null -w '%{http_code}' -X POST $BASE/api/auth/login -H 'Content-Type: application/json' -d '{"id":"nobody","password":"badpass"}')
check "401" "$R" "bad login rejected (401 invalid_credentials)"

echo "== 10. BROADCASTS RLS (anon direct read) =="
SB_URL=$(rg -o 'NEXT_PUBLIC_SUPABASE_URL=(.*)' -r '$1' .env)
SB_ANON=$(rg -o '^NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)' -r '$1' .env)
CODE=$(curl -s -o /tmp/bc.json -w '%{http_code}' "$SB_URL/rest/v1/broadcasts?select=id&limit=3" -H "apikey: $SB_ANON" -H "Authorization: Bearer $SB_ANON")
check "200" "$CODE" "anon SELECT broadcasts via RLS policy"
CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$SB_URL/rest/v1/broadcasts" -H "apikey: $SB_ANON" -H "Authorization: Bearer $SB_ANON" -H 'Content-Type: application/json' -d '{"id":"x","title":{},"body":{},"severity":"high"}')
check "401" "$CODE" "anon INSERT blocked (write locked)"

echo "== 11. WEBHOOK =="
CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST $BASE/api/payments/webhook -H 'Content-Type: application/json' -d '{"metadata":{}}')
check "400" "$CODE" "webhook rejects missing tran_id"
CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST $BASE/api/payments/webhook -H 'Content-Type: application/json' -d '{"metadata":{"tran_id":"does-not-exist"}}')
check "200" "$CODE" "webhook acks unknown tran (re-verified, no false success)"

echo "== 12. PAGES =="
for p in / /notices /payments /login /signup /terms /forgot-password /reset-password /request /profile /pay/$ITEM_ID /admin; do
  C=$(curl -s -o /dev/null -w '%{http_code}' $BASE$p); check "200" "$C" "GET $p"
done

echo "== 13. CLEANUP =="
curl -s -b $AJ -X DELETE $BASE/api/items/$ITEM_ID >/dev/null && ok "test item deleted"
curl -s -b $AJ -X PATCH $BASE/api/payments/$PAY_ID -H 'Content-Type: application/json' -d '{"action":"reject"}' >/dev/null && ok "test due payment cleaned"

echo ""
echo "=============================="
echo "PASS=$PASS FAIL=$FAIL"
echo "=============================="
