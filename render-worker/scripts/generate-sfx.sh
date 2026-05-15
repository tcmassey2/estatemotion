#!/usr/bin/env bash
#
# generate-sfx.sh
#
# Synthesizes the EstateMotion transition SFX library using ffmpeg.
# Outputs MP3 files to render-worker/sfx/.
#
# These are PLACEHOLDER assets — generated mathematically so we have working
# audio in every render from day one. They sound credible (better than no
# SFX), but they're not "premium" sound design. You can swap in curated
# samples from Soundsnap / Splice / Epidemic Sound by replacing the .mp3
# files under render-worker/sfx/ — voice-mixer.mjs picks them by filename.
#
# Why .mp3 (not .wav): smaller (50-150KB each), ffmpeg decodes them with
# negligible overhead, and we want the SFX bus to add as little to the
# render-worker memory footprint as possible.
#
# Usage:
#   bash render-worker/scripts/generate-sfx.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="${SCRIPT_DIR}/../sfx"
mkdir -p "${OUT_DIR}"

# Common ffmpeg flags
FFMPEG_FLAGS="-y -hide_banner -loglevel error"
ENCODE_FLAGS="-c:a libmp3lame -b:a 128k -ar 44100 -ac 2"

echo "Generating SFX into ${OUT_DIR}/"

# ============================================================
# whoosh-1.mp3 — 0.4s bandpass-filtered noise with attack-decay envelope
# Used on: whip_pan transitions (left→right)
# ============================================================
ffmpeg ${FFMPEG_FLAGS} \
  -f lavfi -i "anoisesrc=color=brown:duration=0.4:amplitude=0.7" \
  -af "highpass=f=350,lowpass=f=2800,
       volume=eval=frame:volume='4*t*(0.4-t)*6.25'" \
  ${ENCODE_FLAGS} "${OUT_DIR}/whoosh-1.mp3"
echo "  ✓ whoosh-1.mp3"

# ============================================================
# whoosh-2.mp3 — 0.4s lower bandpass, longer decay (variation for variety)
# Used on: whip_pan transitions (right→left)
# ============================================================
ffmpeg ${FFMPEG_FLAGS} \
  -f lavfi -i "anoisesrc=color=brown:duration=0.4:amplitude=0.7" \
  -af "highpass=f=200,lowpass=f=2200,
       volume=eval=frame:volume='pow(1-t/0.4,1.4)*0.95'" \
  ${ENCODE_FLAGS} "${OUT_DIR}/whoosh-2.mp3"
echo "  ✓ whoosh-2.mp3"

# ============================================================
# impact-1.mp3 — 0.35s low-frequency thud + filtered noise burst
# Used on: match_cut transitions (dramatic moments)
# ============================================================
ffmpeg ${FFMPEG_FLAGS} \
  -f lavfi -i "sine=frequency=80:duration=0.35,volume=0.7" \
  -f lavfi -i "anoisesrc=color=pink:duration=0.35:amplitude=0.5" \
  -filter_complex "[0:a]volume=eval=frame:volume='exp(-t*7)'[lo];
                   [1:a]highpass=f=300,lowpass=f=2200,volume=eval=frame:volume='exp(-t*12)'[hi];
                   [lo][hi]amix=inputs=2:duration=longest:weights=1.6 0.7,
                   aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[out]" \
  -map "[out]" ${ENCODE_FLAGS} "${OUT_DIR}/impact-1.mp3"
echo "  ✓ impact-1.mp3"

# ============================================================
# impact-2.mp3 — 0.18s mid-frequency tap (gentle scene break)
# Used on: blur_wipe transitions, MLS-safe scene breaks
# ============================================================
ffmpeg ${FFMPEG_FLAGS} \
  -f lavfi -i "sine=frequency=220:duration=0.18,volume=0.55" \
  -f lavfi -i "anoisesrc=color=pink:duration=0.18:amplitude=0.3" \
  -filter_complex "[0:a]volume=eval=frame:volume='exp(-t*22)'[lo];
                   [1:a]highpass=f=600,lowpass=f=3500,volume=eval=frame:volume='exp(-t*30)'[hi];
                   [lo][hi]amix=inputs=2:duration=longest:weights=1.0 0.6,
                   aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[out]" \
  -map "[out]" ${ENCODE_FLAGS} "${OUT_DIR}/impact-2.mp3"
echo "  ✓ impact-2.mp3"

# ============================================================
# riser.mp3 — 1.2s ascending build (before reveal/end card)
# Used on: light_leak transitions, before opening address card, before outro
# ============================================================
ffmpeg ${FFMPEG_FLAGS} \
  -f lavfi -i "anoisesrc=color=brown:duration=1.2:amplitude=0.55" \
  -f lavfi -i "sine=frequency=110:duration=1.2,volume=0.4" \
  -filter_complex "[0:a]highpass=f=180,lowpass=f=2400,
                   volume=eval=frame:volume='pow(t/1.2,1.7)*0.85'[noise];
                   [1:a]volume=eval=frame:volume='pow(t/1.2,2.0)*0.5'[tone];
                   [noise][tone]amix=inputs=2:duration=longest:weights=1.0 1.0,
                   aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[out]" \
  -map "[out]" ${ENCODE_FLAGS} "${OUT_DIR}/riser.mp3"
echo "  ✓ riser.mp3"

# ============================================================
# pop.mp3 — 0.12s bright tap (subtle scene break, MLS-safe)
# Used on: slide / wipe / generic transitions, MLS Clean style pack default
# ============================================================
ffmpeg ${FFMPEG_FLAGS} \
  -f lavfi -i "sine=frequency=880:duration=0.12,volume=0.45" \
  -af "aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,
       volume=eval=frame:volume='exp(-t*40)'" \
  ${ENCODE_FLAGS} "${OUT_DIR}/pop.mp3"
echo "  ✓ pop.mp3"

echo ""
echo "Generated 6 SFX files. Sizes:"
ls -la "${OUT_DIR}"/*.mp3 | awk '{printf "  %-15s %sB\n", $9, $5}'
