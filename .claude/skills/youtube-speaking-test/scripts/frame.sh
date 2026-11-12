#!/usr/bin/env bash
# Save one frame from the downloaded video, optionally cropped. Use it to re-read a screen or cut out a task picture.
# Usage: frame.sh <workdir> <time: seconds or mm:ss> <out.png|out.jpg> [crop w:h:x:y]
# Example: frame.sh "$W" 20:00 data/speaking/my-test/scene.jpg 370:370:453:315
set -euo pipefail

work=$1
time=$2
out=$3
crop=${4:-}

ff=$("$work/venv/bin/python" -I -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())")
mkdir -p "$(dirname "$out")"
"$ff" -loglevel error -y -ss "$time" -i "$work/dl/video.mp4" -frames:v 1 ${crop:+-vf "crop=$crop"} -q:v 2 "$out"
echo "$out"
