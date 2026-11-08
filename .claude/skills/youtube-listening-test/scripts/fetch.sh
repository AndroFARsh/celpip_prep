#!/usr/bin/env bash
# Download a CELPIP Listening video for analysis and find its clip boundaries.
# Usage: fetch.sh <youtube-url> <workdir>
# Output (all in the work dir, never the repo):
#   dl/video.mp4        720p video (no audio), for frames
#   dl/audio16k.wav     mono 16 kHz audio, for silence detection and transcription
#   silences.txt        one line per silence: <start>-<end> (<length>), in seconds
#   sheet.png           contact sheet, one timestamped thumbnail per minute
#   chapters from the description are printed
set -euo pipefail

url=$1
work=$2
mkdir -p "$work/dl"
. "$(dirname "$0")/setup.sh"

yt=("$work/venv/bin/yt-dlp" -q --no-warnings --no-progress --no-playlist --js-runtimes node --ffmpeg-location "$ff")
"${yt[@]}" --write-description -f "bv*[height<=720][ext=mp4]/bv*[height<=720]" --remux-video mp4 -o "$work/dl/video.%(ext)s" "$url"
"${yt[@]}" -f "ba[ext=m4a]/ba" -o "$work/dl/audio.%(ext)s" "$url"
"$ff" -loglevel error -y -i "$work"/dl/audio.* -ac 1 -ar 16000 "$work/dl/audio16k.wav"
rm -f "$work"/dl/audio.m4a "$work"/dl/audio.webm

"$ff" -hide_banner -i "$work/dl/audio16k.wav" -af silencedetect=noise=-40dB:d=0.8 -f null - 2>&1 |
  grep -o "silence_\(start\|end\): [0-9.]*" | paste - - | awk '{printf "%.1f-%.1f (%.1f)\n", $2, $4, $4-$2}' >"$work/silences.txt"

# drawtext prints harmless fontconfig warnings on macOS; failures still stop the script.
"$ff" -loglevel error -y -i "$work/dl/video.mp4" \
  -vf "fps=1/60,scale=320:-1,drawtext=text='%{pts\:hms}':x=5:y=5:fontsize=28:fontcolor=red:box=1,tile=6x8" \
  -frames:v 1 "$work/sheet.png" 2>/dev/null

echo "video:    $work/dl/video.mp4"
echo "audio:    $work/dl/audio16k.wav"
echo "silences: $work/silences.txt ($(wc -l <"$work/silences.txt" | tr -d ' '))"
echo "sheet:    $work/sheet.png"
echo "chapters:"
grep -E '^[0-9]{1,2}:[0-9]{2}' "$work/dl/video.description" || echo "  (none in description)"
