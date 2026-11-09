#!/bin/sh
# Screenshots in light and dark. Light: a copy with the dark media query disabled and reveals forced visible.
D=/Users/davidegandolfi/Desktop/Claude/tools/web-templates/agency-02-atlas
T=/private/tmp/claude-501/-Users-davidegandolfi-Desktop-Claude/9698259a-4910-4353-bea2-9c0f2631cc0d/scratchpad/atlas-light
C="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
rm -rf $T; mkdir -p $T; cp $D/*.html $D/app.js $T/; ln -s $D/assets $T/assets
sed 's/@media (prefers-color-scheme: dark)/@media (prefers-color-scheme: dark) and (min-width: 99999px)/' $D/styles.css > $T/styles.css
printf '\nhtml.js .reveal{opacity:1 !important;transform:none !important;transition:none !important}\n' >> $T/styles.css
for p in index listings listing about contact thanks; do
  "$C" --headless=new --disable-gpu --hide-scrollbars --window-size=1440,900 --screenshot=$D/_review/$p-1440.png "file://$T/$p.html" 2>/dev/null
  "$C" --headless=new --disable-gpu --hide-scrollbars --window-size=500,900 --screenshot=$D/_review/$p-500.png "file://$T/$p.html" 2>/dev/null
  "$C" --headless=new --disable-gpu --hide-scrollbars --window-size=1440,4200 --screenshot=$D/_review/$p-1440-full.png "file://$T/$p.html" 2>/dev/null
  "$C" --headless=new --disable-gpu --hide-scrollbars --window-size=500,5600 --screenshot=$D/_review/$p-500-full.png "file://$T/$p.html" 2>/dev/null
done
# dark mode (system scheme), home only
"$C" --headless=new --disable-gpu --hide-scrollbars --force-dark-mode --window-size=1440,2400 --screenshot=$D/_review/index-1440-dark.png "file://$D/index.html" 2>/dev/null
ls $D/_review/*.png | wc -l
