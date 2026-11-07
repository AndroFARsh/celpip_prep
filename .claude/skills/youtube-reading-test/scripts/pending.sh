#!/usr/bin/env bash
# List the videos of a playlist (or a single video) that have no test yet in data/reading/.
# A video counts as done when some data/reading/*/meta.json has "source": "https://www.youtube.com/watch?v=<id>".
# Usage: pending.sh <playlist-or-video-url> <workdir>
# Output: one line per pending video: <playlist index> <video url> <title>
set -euo pipefail

url=$1
work=$2
root=$(git rev-parse --show-toplevel)

if [ ! -x "$work/venv/bin/yt-dlp" ]; then
  python3 -m venv "$work/venv"
  "$work/venv/bin/pip" -q --disable-pip-version-check install yt-dlp certifi imageio-ffmpeg
fi
export SSL_CERT_FILE=$("$work/venv/bin/python" -I -m certifi)

done_ids=$(cat "$root"/data/reading/*/meta.json 2>/dev/null | grep -o 'watch?v=[A-Za-z0-9_-]*' | cut -d= -f2 || true)
"$work/venv/bin/yt-dlp" -q --no-warnings --flat-playlist --print "%(playlist_index)s %(id)s %(title)s" "$url" |
  while read -r idx id title; do
    grep -qxF -- "$id" <<<"$done_ids" || echo "$idx https://www.youtube.com/watch?v=$id $title"
  done
