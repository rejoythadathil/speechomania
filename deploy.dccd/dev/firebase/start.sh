set -eu
mkdir -p /srv/data
if [ -f /srv/data/firebase-export-metadata.json ]; then
  exec firebase emulators:start --only auth --project demo-dccd --import /srv/data --export-on-exit /srv/data
fi
exec firebase emulators:start --only auth --project demo-dccd --export-on-exit /srv/data
