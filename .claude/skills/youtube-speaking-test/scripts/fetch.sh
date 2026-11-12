#!/usr/bin/env bash
# Download a YouTube CELPIP Speaking video and extract frames for reading.
# Usage: fetch.sh <youtube-url> <workdir>
# Output:
#   <workdir>/dl/video.mp4           720p video stream (no audio)
#   <workdir>/frames/t_<sec>.png     one frame every 10 s, named by approximate timestamp
#   <workdir>/sheet.png              contact sheet, one timestamped thumbnail per 10 s: read it first to find the screens
set -euo pipefail

url=$1
work=$2
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
  -f "bv*[height<=720][ext=mp4]/bv*[height<=720]" --ffmpeg-location "$ff" --remux-video mp4 \
  -o "$work/dl/video.%(ext)s" "$url"

video="$work/dl/video.mp4"
rm -f "$work"/frames/*.png
"$ff" -loglevel error -i "$video" -vf "fps=1/10" "$work/frames/f_%04d.png"
for f in "$work"/frames/f_*.png; do
  n=${f##*_}
  n=$((10#${n%.png}))
  mv "$f" "$work/frames/t_$(printf %05d $(((n - 1) * 10))).png"
done

# drawtext prints harmless fontconfig warnings on macOS; failures still stop the script.
"$ff" -loglevel error -y -i "$video" \
  -vf "fps=1/20,scale=320:-1,drawtext=text='%{pts\:hms}':x=5:y=5:fontsize=24:fontcolor=red:box=1,tile=6x15" \
  -frames:v 1 "$work/sheet.png" 2>/dev/null

echo "sheet:  $work/sheet.png"
echo "frames: $(ls "$work"/frames | wc -l | tr -d ' ') in $work/frames (every 10s)"
