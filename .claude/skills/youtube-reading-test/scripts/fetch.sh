#!/usr/bin/env bash
# Download a YouTube CELPIP video and extract frames for reading.
# Usage: fetch.sh <youtube-url> <workdir> [seconds-between-frames=15]
# Output:
#   <workdir>/dl/video.description   chapters are printed below
#   <workdir>/dl/video.mp4            720p video stream (no audio)
#   <workdir>/dl/*.vtt                English captions, if any
#   <workdir>/frames/t_<sec>.png      one frame every N seconds, named by approximate timestamp
#   <workdir>/sheet.png               contact sheet, one timestamped thumbnail per minute: read it first to locate the parts
set -euo pipefail

url=$1
work=$2
step=${3:-15}
mkdir -p "$work/dl" "$work/frames"

if [ ! -x "$work/venv/bin/yt-dlp" ]; then
  python3 -m venv "$work/venv"
  "$work/venv/bin/pip" -q --disable-pip-version-check install yt-dlp certifi imageio-ffmpeg
fi
py="$work/venv/bin/python"
# python.org builds on macOS ship without a CA bundle; use certifi's.
export SSL_CERT_FILE=$("$py" -I -m certifi)
ff=$("$py" -I -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())")

"$work/venv/bin/yt-dlp" -q --no-warnings --no-progress --no-playlist --js-runtimes node \
  --write-description --write-subs --write-auto-subs --sub-langs "en.*" --sub-format vtt \
  -f "bv*[height<=720][ext=mp4]/bv*[height<=720]" --ffmpeg-location "$ff" --remux-video mp4 \
  -o "$work/dl/video.%(ext)s" "$url"

video="$work/dl/video.mp4"
rm -f "$work"/frames/*.png
"$ff" -loglevel error -i "$video" -vf "fps=1/$step" "$work/frames/f_%04d.png"
for f in "$work"/frames/f_*.png; do
  n=${f##*_}
  n=$((10#${n%.png}))
  mv "$f" "$work/frames/t_$(printf %05d $(((n - 1) * step))).png"
done

# drawtext prints harmless fontconfig warnings on macOS; failures still stop the script.
"$ff" -loglevel error -y -i "$video" \
  -vf "fps=1/60,scale=320:-1,drawtext=text='%{pts\:hms}':x=5:y=5:fontsize=28:fontcolor=red:box=1,tile=6x10" \
  -frames:v 1 "$work/sheet.png" 2>/dev/null

echo "video:  $video"
echo "sheet:  $work/sheet.png"
echo "frames: $(ls "$work"/frames | wc -l | tr -d ' ') in $work/frames (every ${step}s)"
echo "captions: $(ls "$work"/dl/*.vtt 2>/dev/null || true)"
echo "chapters:"
grep -E '^[0-9]{1,2}:[0-9]{2}' "$work/dl/video.description" || echo "  (none in description)"
