"""Transcribe clips of a 16 kHz mono WAV. Usage: transcribe.py <audio16k.wav> '<[["name", start, end], ...]>'"""
import json
import sys
import wave

import numpy as np
from faster_whisper import WhisperModel

with wave.open(sys.argv[1]) as w:
    audio = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
model = WhisperModel("base.en", device="cpu", compute_type="int8")
for name, start, end in json.loads(sys.argv[2]):
    segments, _ = model.transcribe(audio[int(start * 16000) : int(end * 16000)], language="en", beam_size=5)
    print(name, "|", " ".join(s.text.strip() for s in segments), flush=True)
