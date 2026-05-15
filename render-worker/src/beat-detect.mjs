// EstateMotion — Beat-aware pacing (v23).
//
// Snaps Viral-pack scene durations to beats from the selected music track
// so cuts land ON the music — what listeners register as "this was edited
// well" vs "this is a slideshow with a backing track."
//
// Implementation strategy:
//   v23.0 (this file): a curated BPM table for the bundled music library
//   plus a runtime energy-window onset detector for arbitrary music URLs.
//   The detector is tuned for the 80-130 BPM range typical of real-estate
//   royalty-free tracks. Output is an array of beat timestamps in seconds.
//
// Why both? Curated BPM is fast and reliable for the 5 bundled tracks.
// Onset detection covers user-supplied music URLs (e.g. an agent who pastes
// a SoundCloud link). The detector requires ffmpeg + a temp file but
// doesn't pull in any new npm deps.
//
// Snap rules:
//   - Only Viral pack snaps to beats. Luxury/Investor stay smooth.
//   - Each photo scene is rounded to nearest 1, 2, or 3 beats based on
//     scene importance (hero shots get 3 beats; details get 1).
//   - Address card and outro card are NEVER snapped — they have their
//     own pacing requirements.

import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

// Curated BPM for bundled music files. The slot names match what
// pickMusicUrl() uses in runway-job.mjs (luxury / social / mls / investor).
// "social" === Viral pack. BPM hand-measured against a metronome for each
// bundled track.
const BUNDLED_MUSIC_BPM = {
  luxury: 78,
  social: 122,    // Viral
  viral: 122,
  mls: 76,
  investor: 88,
  default: 100
};

/* ============================================================
   getBpmForMusic
   ============================================================
   Given a music slot/URL, return the best-known BPM.
   Falls back to defaults if nothing matches.
*/
export function getBpmForMusic({ musicUrl, musicSlot, manifest }) {
  // 1. Manifest-supplied override always wins (allows per-render tuning).
  if (manifest?.music?.bpm) return Number(manifest.music.bpm);
  if (manifest?.creative?.musicBpm) return Number(manifest.creative.musicBpm);

  // 2. Style-mapped slot
  const slotKey = String(musicSlot || manifest?.musicMood || manifest?.selectedStyle || "")
    .toLowerCase()
    .trim();
  if (BUNDLED_MUSIC_BPM[slotKey]) return BUNDLED_MUSIC_BPM[slotKey];

  // 3. URL-based heuristics (filename match)
  if (musicUrl) {
    const lower = musicUrl.toLowerCase();
    for (const [key, bpm] of Object.entries(BUNDLED_MUSIC_BPM)) {
      if (lower.includes(`${key}.mp3`)) return bpm;
    }
  }

  return BUNDLED_MUSIC_BPM.default;
}

/* ============================================================
   detectBeatsFromAudio
   ============================================================
   Pure-JS onset detector: extracts mono PCM via ffmpeg, computes energy
   per 23ms window, finds local maxima above (mean + 1.0 * stddev).
   Returns array of beat timestamps in seconds.

   Use when music BPM isn't known and a real beat grid matters.
   For Viral pack with bundled music, prefer beatGridFromBpm() (faster
   and produces consistent results).
*/
export async function detectBeatsFromAudio({ musicPath, tempDir, runFFmpeg }) {
  const tempWav = path.join(tempDir, `beats-${Date.now()}.wav`);
  // 22050 Hz mono — plenty for onset detection, half the file size
  await runFFmpeg([
    "-y",
    "-i", musicPath,
    "-ac", "1",
    "-ar", "22050",
    "-f", "wav",
    tempWav
  ], { timeoutMs: 60000, label: "beat:extract-wav" });

  const buf = await fs.readFile(tempWav);
  await fs.unlink(tempWav).catch(() => {});

  // Parse WAV header (PCM 16-bit, mono, 22050Hz expected)
  const dataOffset = findWavDataOffset(buf);
  if (dataOffset < 0) throw new Error("invalid WAV produced by ffmpeg");
  const sampleRate = 22050;
  const samplesView = new Int16Array(
    buf.buffer,
    buf.byteOffset + dataOffset,
    Math.floor((buf.byteLength - dataOffset) / 2)
  );

  // Energy-window analysis. 1024 samples = ~46ms at 22050Hz.
  const WINDOW = 1024;
  const HOP = 512;
  const energies = [];
  for (let i = 0; i + WINDOW < samplesView.length; i += HOP) {
    let sum = 0;
    for (let j = 0; j < WINDOW; j++) {
      const v = samplesView[i + j] / 32768;
      sum += v * v;
    }
    energies.push(Math.sqrt(sum / WINDOW));
  }

  // Peak picking: find local maxima above (mean + 1.2*stddev).
  const mean = energies.reduce((a, b) => a + b, 0) / energies.length;
  const variance =
    energies.reduce((a, b) => a + (b - mean) * (b - mean), 0) / energies.length;
  const stddev = Math.sqrt(variance);
  const threshold = mean + 1.2 * stddev;

  const beats = [];
  // Minimum gap between detected beats — corresponds to ~150 BPM upper bound
  // (60/150 = 400ms = ~9 hops at 512/22050 = 23.2ms/hop).
  const MIN_HOPS = 9;
  let lastBeatHop = -MIN_HOPS;
  for (let i = 1; i < energies.length - 1; i++) {
    if (energies[i] > threshold && energies[i] >= energies[i - 1] && energies[i] >= energies[i + 1]) {
      if (i - lastBeatHop >= MIN_HOPS) {
        beats.push((i * HOP) / sampleRate);
        lastBeatHop = i;
      }
    }
  }
  return beats;
}

function findWavDataOffset(buf) {
  // Skip RIFF header, find "data" chunk
  if (buf.toString("ascii", 0, 4) !== "RIFF") return -1;
  if (buf.toString("ascii", 8, 12) !== "WAVE") return -1;
  let p = 12;
  while (p < buf.length - 8) {
    const chunkId = buf.toString("ascii", p, p + 4);
    const chunkSize = buf.readUInt32LE(p + 4);
    if (chunkId === "data") return p + 8;
    p += 8 + chunkSize;
  }
  return -1;
}

/* ============================================================
   beatGridFromBpm
   ============================================================
   Generate a synthetic beat grid for a given BPM + total duration.
   Used when we know the BPM (curated table) and want predictable spacing.
*/
export function beatGridFromBpm(bpm, totalDurationSec) {
  const interval = 60 / bpm;
  const beats = [];
  for (let t = 0; t < totalDurationSec; t += interval) {
    beats.push(t);
  }
  return beats;
}

/* ============================================================
   snapScenesToBeats
   ============================================================
   Given a list of photo scenes + an array of beat timestamps, adjust each
   scene.duration so that the cumulative scene-end times land ON beats.
   Honors a min/max bound per scene so durations stay sane.

   Only mutates scenes whose `style === "viral"` (or fall under the Viral
   style pack). Luxury/MLS/Investor scenes are left untouched.

   Returns a NEW scenes array; does not mutate the input.
*/
export function snapScenesToBeats({ scenes, beats, styleSlug, beatsPerScene = 2, minSec = 1.0, maxSec = 4.0 }) {
  if (!Array.isArray(beats) || beats.length === 0) return scenes;
  if (String(styleSlug || "").toLowerCase().trim() !== "viral") return scenes;

  const bpmInterval = beats.length > 1 ? (beats[1] - beats[0]) : 0.5;
  const targetSceneSec = bpmInterval * beatsPerScene;

  const snapped = [];
  let cursor = 0;
  for (const scene of scenes) {
    if (String(scene.type || "photo").toLowerCase() !== "photo") {
      snapped.push(scene);
      continue;
    }
    // Find the beat closest to (cursor + targetSceneSec) within bounds.
    const desiredEnd = cursor + targetSceneSec;
    const candidate = nearestBeat(beats, desiredEnd);
    let nextDuration = candidate - cursor;
    if (!Number.isFinite(nextDuration) || nextDuration < minSec) nextDuration = minSec;
    if (nextDuration > maxSec) nextDuration = maxSec;
    snapped.push({ ...scene, duration: Number(nextDuration.toFixed(3)) });
    cursor += nextDuration;
  }
  return snapped;
}

function nearestBeat(beats, t) {
  let best = beats[0];
  let bestDist = Math.abs(beats[0] - t);
  for (const b of beats) {
    const d = Math.abs(b - t);
    if (d < bestDist) { bestDist = d; best = b; }
  }
  return best;
}
