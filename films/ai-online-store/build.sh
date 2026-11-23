#!/bin/sh
# One Pair of Hands: rebuild the whole film from this folder's source.   sh build.sh
# Needs the Lemo-Opuscar library (LIB) with its core, voice and music tiers installed, ffmpeg 7+ on PATH, Node 20+.
# Rendering is software WebGL here (LEMO_ANGLE=swiftshader, ~3 s a frame on 4 cores); on a Mac or a machine with a GPU, leave LEMO_ANGLE unset.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}          # clone mode: <library>/films/<name>/
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
cd "$LIB"
PY="$LIB/.venv/bin/python"
SIZE=1080x1920; FPS=30; NAME=one-pair-of-hands

# 1. narration (offline Kokoro), its speech-to-text check, and the sample libraries the score needs (downloaded before the long render)
"$PY" core/tts/tts.py "$HERE/tts/lines.json" "$HERE/voices"
"$PY" core/tts/asr_check.py "$HERE/tts/lines.json" "$HERE/voices" --lang en
"$PY" core/audio/sampler.py --need "$HERE/score.py"

# 2. timeline → JSON, sound events from the page, reading-time check
node "$HERE/export_timeline.mjs"
node core/render/events.mjs "$HERE" --size $SIZE
node core/render/readcheck.mjs "$HERE" --size $SIZE --q 'measure=1'

# 3. score and mix
"$PY" "$HERE/score.py"
"$PY" "$HERE/mix.py"

# 4. picture in four slices (each one can run on its own machine or in parallel), then joined
mkdir -p "$HERE/out"; : > "$HERE/out/slices.txt"
for T0 in 0 22.5 45 67.5; do
  node core/render/video.mjs "$HERE" --fps $FPS --workers 1 --size $SIZE --q "t0=$T0&dur=22.5" --out "$HERE/out/slice_$T0.mp4"
  echo "file 'slice_$T0.mp4'" >> "$HERE/out/slices.txt"
done
(cd "$HERE/out" && ffmpeg -y -loglevel error -f concat -safe 0 -i slices.txt -c copy video.mp4)

# 5. master (two-pass loudnorm to −14 LUFS, light grain), subtitles, poster
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/$NAME.mp4" $FPS 1
node "$HERE/make_srt.mjs" && "$PY" core/render/srt.py "$HERE/out/cues.json" "$HERE/subtitles_en.srt"
ffmpeg -y -loglevel error -ss 78.5 -i "$HERE/$NAME.mp4" -frames:v 1 -q:v 2 "$HERE/poster.jpg"
echo "done: $HERE/$NAME.mp4"
