#!/bin/bash
# Build the Chrome Web Store zip: dist/site-hotkeys-<version>.zip
# Only the files the extension needs go in, and the "key" line is removed
# from the manifest (the store assigns its own ID).
set -euo pipefail
cd "$(dirname "$0")"

FILES=(manifest.json background.js storage.js content.js popup.html popup.js options.html options.js icons)

VERSION=$(python3 -c 'import json; print(json.load(open("manifest.json"))["version"])')
OUT="dist/site-hotkeys-${VERSION}.zip"
STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT

for f in "${FILES[@]}"; do cp -R "$f" "$STAGE/"; done
rm -f "$STAGE/icons/icon.svg" "$STAGE/icons/make-icons.sh"   # source art and tooling, not part of the package

python3 - "$STAGE/manifest.json" <<'EOF'
import json, sys
p = sys.argv[1]
m = json.load(open(p))
m.pop("key", None)
json.dump(m, open(p, "w"), indent=2, ensure_ascii=False)
EOF

mkdir -p dist
rm -f "$OUT"
(cd "$STAGE" && zip -qr -X "$OLDPWD/$OUT" . -x ".DS_Store")
echo "Built $OUT"
unzip -l "$OUT" | tail -n +4
