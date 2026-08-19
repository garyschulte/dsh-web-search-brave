#!/usr/bin/env bash
# Install the local Brave Search provider into the DSH web profile.
# Run from anywhere:  bash install.sh
# Idempotent — safe to re-run.
set -euo pipefail

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/dsh-web-search-brave"
PROFILE="$HOME/.dsh/profiles/web"
NM="$PROFILE/node_modules"
PKG_NAME="dsh-web-search-brave"

echo "== 1/5 Copy package into profile node_modules =="
rm -rf "$NM/$PKG_NAME"
cp -r "$SRC" "$NM/$PKG_NAME"

echo "== 2/5 Register as profile dependency + bundle =="
python3 - "$PROFILE/package.json" "$PKG_NAME" <<'EOF'
import json, sys
p, name = sys.argv[1], sys.argv[2]
d = json.load(open(p))
d["dependencies"][name] = "file:./node_modules/dsh-web-search-brave"
bundles = d.setdefault("dsh", {}).setdefault("profile", {}).setdefault("bundles", [])
if name not in bundles:
    bundles.append(name)
json.dump(d, open(p, "w"), indent=2)
open(p, "a").write("\n")
print(open(p).read())
EOF

echo "== 3/5 Point web.searchProvider at brave-search =="
cat > "$PROFILE/cordis.patch.yml" <<'EOF'
# User overlay for the web profile.
# Override the web capability seam to use the local Brave Search provider.
- id: web
  config:
    searchProvider: brave-search
EOF
echo "wrote $PROFILE/cordis.patch.yml"

echo "== 4/5 Ensure BRAVE_API_KEY in ~/.dsh/.env =="
if grep -q '^BRAVE_API_KEY=' "$HOME/.dsh/.env" 2>/dev/null; then
  echo "BRAVE_API_KEY already present in ~/.dsh/.env — leaving it alone"
elif [ -n "${BRAVE_API_KEY:-}" ]; then
  touch "$HOME/.dsh/.env"
  echo "BRAVE_API_KEY=$BRAVE_API_KEY" >> "$HOME/.dsh/.env"
  echo "BRAVE_API_KEY stored from environment (value not printed)"
else
  echo "WARN: no existing BRAVE_API_KEY in ~/.dsh/.env and none in environment;"
  echo "      export BRAVE_API_KEY before running, or add it to ~/.dsh/.env yourself."
fi

echo "== 5/5 Smoke test: import the provider from profile context =="
cat > "$NM/.brave-smoke.mjs" <<'EOF'
const m = await import("dsh-web-search-brave");
if (typeof m.apply !== "function") throw new Error("apply() missing");
if (m.name !== "web-search-brave") throw new Error("bad name export: " + m.name);
console.log("OK: provider module loads; exports:", Object.keys(m).join(", "));
EOF
(cd "$NM" && node .brave-smoke.mjs)
rm -f "$NM/.brave-smoke.mjs"

echo
echo "DONE. Next steps:"
echo "  1. Verify composed config:   dsh --profile web --dump-config | grep -A3 brave"
echo "  2. Restart the running web GUI (kills the current session):"
echo "       pkill -f 'dsh web'; cd \$HOME && ~/.local/bin/dsh web"
