Setup Windows — URL zyrtare (duhet të përputhet me asset-in në Releases):

https://github.com/alfaportal/revolution-pos-server/releases/download/setup-v1.0.237/KAFENE-Setup.exe

Si të ngarkosh version të ri:
  1. Kopjo Setup si KAFENE-Setup.exe (emër fikse)
  2. gh release create setup-vX.Y.Z KAFENE-Setup.exe --title "KAFENE Setup X.Y.Z"
  3. Ndrysho DEFAULT_SETUP_DOWNLOAD_URL + DEFAULT_SETUP_VERSION në src/lib/publicOrigin.js

MOS përdor emrin «Sistemi i Kafenes Setup …» në URL — browseri / GitHub e bën 404.
