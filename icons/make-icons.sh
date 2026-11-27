#!/bin/bash
# Regenerate the PNG icons from icon.svg (needs rsvg-convert: brew install librsvg).
#  - icon-16/32/48: the art fills the frame, so it reads at toolbar size.
#  - icon-128: store icon. Chrome Web Store wants ~96px artwork centered in
#    128px with 16px transparent padding, so the art is scaled to 96px.
set -euo pipefail
cd "$(dirname "$0")"

for s in 16 32 48; do
  rsvg-convert -w $s -h $s icon.svg -o icon-$s.png
done

# The 24-unit source art measures ~22.1 units wide with its stroke.
# Scale so that is 96px inside a 128px canvas: 96 / 22.1 = 4.3438.
INNER=$(sed -e 's/^<svg[^>]*>//' -e 's/<\/svg>$//' icon.svg)
STROKE=$(grep -o 'stroke="[^"]*"' icon.svg | head -1)
TMP=$(mktemp).svg
cat > "$TMP" <<EOF
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
<g transform="translate(64 64) scale(4.3438) translate(-12 -12)" fill="none" ${STROKE} stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${INNER}</g>
</svg>
EOF
rsvg-convert -w 128 -h 128 "$TMP" -o icon-128.png
rm -f "$TMP"
echo "icons rebuilt"
