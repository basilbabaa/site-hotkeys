#!/bin/bash
# Render the store screenshots (screenshot-1.html, screenshot-2.html) to 1280x800 JPEGs.
# The store wants JPEG or 24-bit PNG with no transparency. Needs Google Chrome installed.
set -euo pipefail
cd "$(dirname "$0")"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
mkdir -p screenshots
TMP=$(mktemp -d)
for n in 1 2; do
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --window-size=1280,800 --screenshot="$TMP/shot$n.png" "file://$PWD/screenshot-$n.html" >/dev/null 2>&1
  sips -s format jpeg -s formatOptions 95 "$TMP/shot$n.png" --out "screenshots/screenshot-$n-1280x800.jpg" >/dev/null
  echo "screenshot-$n-1280x800.jpg: $(sips -g pixelWidth -g pixelHeight "screenshots/screenshot-$n-1280x800.jpg" | tail -2 | awk '{print $2}' | paste -sd x -)"
done
rm -rf "$TMP"
