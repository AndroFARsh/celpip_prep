#!/usr/bin/env bash
# List the videos of a playlist (or a single video) that have no test yet in data/speaking/.
# A video counts as done when some data/speaking/*/meta.json has "source": "https://www.youtube.com/watch?v=<id>",
# or when data/speaking/duplicates.txt lists its id (a re-upload of a test that already exists).
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

done_ids=$( (cat "$root"/data/speaking/*/meta.json 2>/dev/null | grep -o 'watch?v=[A-Za-z0-9_-]*' | cut -d= -f2
  cut -d' ' -f1 "$root/data/speaking/duplicates.txt" 2>/dev/null) || true)
"$work/venv/bin/yt-dlp" -q --no-warnings --flat-playlist --print "%(playlist_index)s %(id)s %(title)s" "$url" |
  while read -r idx id title; do
    grep -qxF -- "$id" <<<"$done_ids" || echo "$idx https://www.youtube.com/watch?v=$id $title"
  done
