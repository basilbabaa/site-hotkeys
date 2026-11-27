#!/bin/bash
# Render the promo tiles from promo.html: small 440x280 and marquee 1400x560, as flat JPEGs.
# Needs Google Chrome installed.
set -euo pipefail
cd "$(dirname "$0")"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
mkdir -p screenshots
TMP=$(mktemp -d)
render() {  # name width height
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --window-size=$2,$3 --screenshot="$TMP/$1.png" "file://$PWD/promo.html#$1" >/dev/null 2>&1
  sips -s format jpeg -s formatOptions 95 "$TMP/$1.png" --out "screenshots/promo-$1-$2x$3.jpg" >/dev/null
  echo "promo-$1-$2x$3.jpg: $(sips -g pixelWidth -g pixelHeight "screenshots/promo-$1-$2x$3.jpg" | tail -2 | awk '{print $2}' | paste -sd x -)"
}
render small 440 280
render marquee 1400 560
rm -rf "$TMP"
