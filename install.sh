#!/usr/bin/env bash
# Install this Brave Search provider into the DSH web profile from a local
# checkout. Run from the repository root:  bash install.sh
# Idempotent — safe to re-run.
#
# For a normal user install (no checkout) use the published package instead:
#   dsh plugin --profile web add <your-package-name>
# where <your-package-name> is the "name" from package.json.
set -euo pipefail

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROFILE="$HOME/.dsh/profiles/web"
NM="$PROFILE/node_modules"

# Read the package name from package.json (scoped or not).
PKG_NAME="$(python3 -c "import json;print(json.load(open('$SRC/package.json'))['name'])")"

echo "Using package name: $PKG_NAME"

# Self-heal: drop any previous install under a different package name
# (e.g. an earlier unscoped dsh-web-search-brave) so it does not linger.
OLD_NAME="dsh-web-search-brave"
if [ "$OLD_NAME" != "$PKG_NAME" ]; then
  python3 - "$PROFILE/package.json" "$OLD_NAME" "$PKG_NAME" <<'EOF'
import json, sys, os
path, old, new = sys.argv[1], sys.argv[2], sys.argv[3]
if not os.path.exists(path):
    sys.exit(0)
with open(path) as f:
    d = json.load(f)
changed = False
deps = d.get("dependencies", {})
if old in deps and new not in deps:
    del deps[old]
    changed = True
bundles = d.get("dsh", {}).get("profile", {}).get("bundles", [])
if old in bundles:
    bundles.remove(old)
    changed = True
if changed:
    with open(path, "w") as f:
        json.dump(d, f, indent=2)
        f.write("\n")
    print(f"cleaned stale references to {old}")
EOF
  [ -d "$NM/$OLD_NAME" ] && rm -rf "$NM/$OLD_NAME" && echo "removed stale node_modules/$OLD_NAME"
fi

echo "== 1/4 Copy package into profile node_modules =="
rm -rf "$NM/$PKG_NAME"
mkdir -p "$NM/$PKG_NAME"
(
  cd "$SRC"
  for f in package.json index.js cordis.patch.yml README.md AGENTS.md CHANGELOG.md LICENSE; do
    [ -f "$f" ] && cp "$f" "$NM/$PKG_NAME/"
  done
  [ -d client ] && cp -r client "$NM/$PKG_NAME/client"
)

echo "== 2/4 Register as profile dependency + bundle =="
python3 - "$PROFILE/package.json" "$PKG_NAME" <<'EOF'
import json, sys, os
p, name = sys.argv[1], sys.argv[2]
os.makedirs(os.path.dirname(p), exist_ok=True)
if os.path.exists(p):
    d = json.load(open(p))
else:
    d = {"name": "dsh-profile-web", "private": True, "dependencies": {}}
d["dependencies"][name] = "file:./node_modules/" + name
bundles = d.setdefault("dsh", {}).setdefault("profile", {}).setdefault("bundles", [])
if name not in bundles:
    bundles.append(name)
json.dump(d, open(p, "w"), indent=2)
open(p, "a").write("\n")
print(open(p).read())
EOF

echo "== 3/4 Point web.searchProvider at brave-search =="
mkdir -p "$PROFILE"
cat > "$PROFILE/cordis.patch.yml" <<'EOF'
# User overlay for the web profile.
# Override the web capability seam to use this Brave Search provider.
- id: web
  config:
    searchProvider: brave-search
EOF
echo "wrote $PROFILE/cordis.patch.yml"

echo "== 4/4 Ensure BRAVE_API_KEY in ~/.dsh/.env =="
mkdir -p "$HOME/.dsh"
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

echo
echo "DONE. Next steps:"
echo "  1. Verify composed config:   dsh --profile web --dump-config | grep -A3 brave"
echo "  2. Restart the running web GUI (kills the current session):"
echo "       pkill -f 'dsh web'; cd \$HOME && ~/.local/bin/dsh web"
