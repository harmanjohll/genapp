#!/usr/bin/env bash
# Runs every E21CC Log test against a local copy of the site.
#   e21cclog/tests/run.sh            all suites, the console sweep, one colour sweep per look
#   FULL=1 e21cclog/tests/run.sh     also the full 48 combination colour sweep and the route audit
# Needs Node 18 or later, Python 3, and Playwright with Chromium (npx playwright install chromium).
set -u
cd "$(dirname "$0")"
ROOT="$(cd ../.. && pwd)"
export BASE="${BASE:-http://localhost:8123/e21cclog/}"
export OUT="${OUT:-$(pwd)/out}"; mkdir -p "$OUT"
python3 -m http.server 8123 --directory "$ROOT" > "$OUT/server.log" 2>&1 & SERVER=$!
node mockrelay.js > "$OUT/relay.log" 2>&1 & RELAY=$!
trap 'kill $SERVER $RELAY 2>/dev/null' EXIT
for i in $(seq 1 30); do curl -sf "$BASE/index.html" >/dev/null && curl -sf localhost:8124/reset >/dev/null && break; sleep 0.5; done
fails=0
run(){ local name=$1; shift; curl -sf localhost:8124/reset >/dev/null; if "$@" > "$OUT/$name.txt" 2>&1 && grep -q "^PASS\|^findings 0 " "$OUT/$name.txt" && ! grep -q "^FAIL\|^findings [1-9]\|PAGEERROR" "$OUT/$name.txt"; then echo "pass  $name  $(grep -c '^PASS' "$OUT/$name.txt") checks"; else echo "FAIL  $name  (see $OUT/$name.txt)"; grep "^FAIL" "$OUT/$name.txt" | head -5; fails=$((fails+1)); fi; }
for t in t2 t4 t6 t7 t8 t9 t10 t11 t12 t13 t14 t15; do [ -f "$t.js" ] && run "$t" node "$t.js"; done
run console-sweep node tsweep.js "$OUT/tsweep.md"
if [ "${FULL:-}" = 1 ]; then
  run colour-sweep node sweep.js "$OUT/sweep.md"
  for L in a b c d; do for T in light dark; do run "audit-$L-$T" env LOOK=$L:$T VIEWS=320x640,390x844,768x1024,1024x768,1280x800,1440x900,1920x1080 node audit.js "$OUT/audit-$L-$T.md"; done; done
else
  for L in a b c d; do run "colour-sweep-$L" env LOOKS=$L THEMES=light,dark COLOURS=navy VIEWS=390x844,1280x800 node sweep.js "$OUT/sweep-$L.md"; done
fi
echo; [ $fails -eq 0 ] && echo "ALL PASS" || echo "$fails FAILED"
exit $fails
