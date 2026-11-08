#!/usr/bin/env bash
# Transcribe the spoken questions (or any clips) with Whisper, locally.
# Usage: transcribe.sh <workdir> '<[["p1q1", 181.8, 185.4], ...]>'
# Output: one line per clip: <name> | <text>
set -euo pipefail

work=$1
. "$(dirname "$0")/setup.sh"
"$py" -I "$(dirname "$0")/transcribe.py" "$work/dl/audio16k.wav" "$2" 2>&1 | grep -v Warning
