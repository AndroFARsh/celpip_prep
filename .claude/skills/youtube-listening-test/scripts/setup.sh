#!/usr/bin/env bash
# Create the work dir's Python venv with yt-dlp, ffmpeg and faster-whisper. Sourced by the other scripts.
# Sets: py (venv python), ff (ffmpeg path), SSL_CERT_FILE.
if [ ! -x "$work/venv/bin/yt-dlp" ] || ! "$work/venv/bin/python" -I -c "import faster_whisper" 2>/dev/null; then
  python3 -m venv "$work/venv"
  "$work/venv/bin/pip" -q --disable-pip-version-check install yt-dlp certifi imageio-ffmpeg faster-whisper numpy
fi
py="$work/venv/bin/python"
# python.org builds on macOS ship without a CA bundle; use certifi's.
export SSL_CERT_FILE=$("$py" -I -m certifi)
ff=$("$py" -I -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())")
