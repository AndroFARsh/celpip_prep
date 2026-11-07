#!/usr/bin/env bash
# Extract only the distinct slides from a section of the video (e.g. the answer key), plus a contact sheet of them.
# Usage: slides.sh <workdir> <start: seconds or mm:ss> [end]
# Output: <workdir>/slides/s_NNN.png (full size, in order) and <workdir>/slides/sheet.png (5 per row)
set -euo pipefail

work=$1
start=$2
end=${3:-}

ff=$("$work/venv/bin/python" -I -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())")
mkdir -p "$work/slides"
rm -f "$work"/slides/*.png
"$ff" -loglevel error -ss "$start" ${end:+-to "$end"} -i "$work/dl/video.mp4" \
  -vf "fps=1,mpdecimate=hi=64*40:lo=64*20:frac=0.1" -fps_mode vfr "$work/slides/s_%03d.png"
"$ff" -loglevel error -y -i "$work/slides/s_%03d.png" -vf "scale=384:-1,tile=5x8" -frames:v 1 "$work/slides/sheet.png"
echo "$(ls "$work"/slides/s_*.png | wc -l | tr -d ' ') slides; sheet: $work/slides/sheet.png"
