// EstateMotion — Lifestyle B-roll library via Pexels (v23).
//
// Fetches royalty-free lifestyle clips from the Pexels Videos API and
// caches them locally so the AI curator can intercut 2-4 cutaways into
// every render. The variety is what reads as "professional editor" vs.
// "uploaded a folder of room photos."
//
// Pexels is free up to 200 reqs/hour with attribution. We cache fetched
// clips in /tmp/em-broll-cache/ so repeated renders don't redownload.
// The cache is keyed by category — same category always returns the same
// clip across a given worker process lifetime.
//
// What clips we fetch (curated category list):
//   coffee_pour     — kitchen cutaway
//   sunset_window   — luxury / mood interlude
//   walking_path    — exterior / approach
//   doorknob_handle — entry detail
//   fireplace       — luxury living
//   pet_dog         — family lifestyle
//   wine_pour       — luxury
//   plant_water     — clean modern detail
//
// Each category maps to a Pexels search query that consistently returns
// usable clips (vertical-first, short, real footage rather than stock-y).
//
// Failure mode: if Pexels is unavailable or PEXELS_API_KEY is missing,
// returns []. Render proceeds without B-roll.

import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const PEXELS_BASE = "https://api.pexels.com/videos";
const FETCH_TIMEOUT_MS = 15000;

// Cache directory — survives across renders within a single worker process,
// gets cleaned by Render.com between deploys (which is fine; it'll re-warm).
const CACHE_DIR = path.join(os.tmpdir(), "em-broll-cache");

// Curated category catalog. Each entry has:
//   - slug            — internal identifier
//   - query           — what to search Pexels for
//   - orientation     — preferred orientation (portrait / landscape)
//   - minSec / maxSec — only consider clips in this duration range
//   - bestForRooms    — which roomTypes this cutaway pairs well with
//   - description     — user-facing label
const CATEGORIES = [
  {
    slug: "coffee_pour",
    query: "pouring coffee close up",
    orientation: "portrait",
    minSec: 3,
    maxSec: 12,
    bestForRooms: ["kitchen", "dining"],
    description: "Coffee pouring (kitchen cutaway)"
  },
  {
    slug: "sunset_window",
    query: "sunset through window curtains",
    orientation: "portrait",
    minSec: 4,
    maxSec: 15,
    bestForRooms: ["bedroom", "living", "exterior"],
    description: "Sunset through window (mood interlude)"
  },
  {
    slug: "walking_path",
    query: "walking down driveway slow motion",
    orientation: "portrait",
    minSec: 4,
    maxSec: 12,
    bestForRooms: ["exterior", "entry"],
    description: "Walking up to a home (approach)"
  },
  {
    slug: "doorknob_handle",
    query: "hand opening door brass handle",
    orientation: "portrait",
    minSec: 2,
    maxSec: 8,
    bestForRooms: ["entry", "exterior"],
    description: "Hand on door handle (entry detail)"
  },
  {
    slug: "fireplace",
    query: "fireplace fire burning cozy close up",
    orientation: "portrait",
    minSec: 3,
    maxSec: 15,
    bestForRooms: ["living", "bedroom"],
    description: "Fireplace flames (luxury living)"
  },
  {
    slug: "pet_dog",
    query: "golden retriever lying on rug home",
    orientation: "portrait",
    minSec: 3,
    maxSec: 10,
    bestForRooms: ["living", "kitchen"],
    description: "Family dog (lifestyle)"
  },
  {
    slug: "wine_pour",
    query: "pouring red wine glass close up",
    orientation: "portrait",
    minSec: 3,
    maxSec: 10,
    bestForRooms: ["dining", "kitchen", "living"],
    description: "Wine pour (luxury)"
  },
  {
    slug: "plant_water",
    query: "watering houseplant droplets sunlight",
    orientation: "portrait",
    minSec: 3,
    maxSec: 10,
    bestForRooms: ["living", "kitchen", "bedroom"],
    description: "Plant care (clean modern)"
  }
];

/* ============================================================
   getBrollSuggestions — high-level entry
   ============================================================
   Given a manifest, returns N B-roll clip suggestions tailored to the
   scenes in the render. Each suggestion has:
     - { categorySlug, videoUrl, durationSec, attribution, photographer }
   Caller decides whether/how to inject into the timeline.

   Returns [] if PEXELS_API_KEY is unset or any error occurs.
*/
export async function getBrollSuggestions({ manifest, count = 3 }) {
  if (!process.env.PEXELS_API_KEY) {
    return [];
  }
  if (manifest?.disableBroll) return [];

  await fs.mkdir(CACHE_DIR, { recursive: true });

  // Score each category against the scenes in the manifest. Pick top N.
  const sceneRoomTypes = (manifest?.scenes || [])
    .map((s) => String(s.roomType || "").toLowerCase().trim())
    .filter(Boolean);
  const roomCounts = new Map();
  for (const r of sceneRoomTypes) {
    roomCounts.set(r, (roomCounts.get(r) || 0) + 1);
  }

  const scored = CATEGORIES.map((cat) => {
    // Score: sum of room-type matches × frequency in scenes
    const score = cat.bestForRooms.reduce(
      (acc, room) => acc + (roomCounts.get(room) || 0),
      0
    );
    return { cat, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const chosen = scored.slice(0, Math.min(count, CATEGORIES.length));

  // Fetch a clip URL for each chosen category (parallel).
  const results = await Promise.allSettled(chosen.map(({ cat }) => fetchCategoryClip(cat)));
  return results
    .filter((r) => r.status === "fulfilled" && r.value)
    .map((r) => r.value);
}

/* ============================================================
   fetchCategoryClip — fetch + cache one clip for a category
   ============================================================ */
async function fetchCategoryClip(category) {
  // Cached?
  const cachePath = path.join(CACHE_DIR, `${category.slug}.json`);
  try {
    const raw = await fs.readFile(cachePath, "utf8");
    const cached = JSON.parse(raw);
    if (cached.videoUrl) return cached;
  } catch {
    // not cached — continue
  }

  // Pexels search
  const url = `${PEXELS_BASE}/search?` + new URLSearchParams({
    query: category.query,
    per_page: "10",
    orientation: category.orientation || "portrait",
    size: "medium"
  }).toString();

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  let body;
  try {
    const res = await fetch(url, {
      headers: { Authorization: process.env.PEXELS_API_KEY },
      signal: ctrl.signal
    });
    if (!res.ok) {
      throw new Error(`Pexels HTTP ${res.status}`);
    }
    body = await res.json();
  } finally {
    clearTimeout(timer);
  }

  const candidates = (body?.videos || [])
    .filter((v) => v.duration >= category.minSec && v.duration <= category.maxSec)
    .filter((v) => Array.isArray(v.video_files) && v.video_files.length > 0);

  if (candidates.length === 0) return null;

  // Pick one — use a deterministic hash of the category slug so the same
  // category always returns the same clip across worker restarts (until
  // Pexels' top results change).
  const pick = candidates[deterministicIndex(category.slug, candidates.length)];

  // Within the chosen video, prefer 1080p / hd quality at portrait orientation.
  const file =
    pick.video_files.find((f) => f.quality === "hd" && f.width <= 1920) ||
    pick.video_files.find((f) => f.quality === "sd" && f.width >= 720) ||
    pick.video_files[0];

  const result = {
    categorySlug: category.slug,
    description: category.description,
    videoUrl: file.link,
    durationSec: pick.duration,
    width: file.width,
    height: file.height,
    attribution: `Video by ${pick.user?.name || "Unknown"} on Pexels`,
    photographer: pick.user?.name || "",
    photographerUrl: pick.user?.url || "",
    pexelsId: pick.id,
    pexelsPageUrl: pick.url
  };

  // Cache for next render
  await fs.writeFile(cachePath, JSON.stringify(result, null, 2)).catch(() => {});
  return result;
}

// Deterministic index — same input → same output, distributed roughly
// evenly across N. Avoids picking the same Pexels result from every worker.
function deterministicIndex(seed, n) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h) + seed.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % n;
}

// Public catalog (for UI).
export function getBrollCategories() {
  return CATEGORIES.map((c) => ({
    slug: c.slug,
    description: c.description,
    bestForRooms: c.bestForRooms
  }));
}

/* ============================================================
   prepareBrollClips — download + normalize B-roll for stitch
   ============================================================
   Downloads each B-roll URL from Pexels, then runs ffmpeg to:
     - scale + crop to target dimensions (matching scene clips)
     - trim to durationSec (default 4s)
     - encode H.264 with the same params as scene clips
     - strip audio (audio comes from music+narration+SFX bus)
   Returns an array of { clipPath, suggestion } for stitch use.

   Failures are logged and the clip is skipped — we never block render
   on a B-roll fetch.
*/
export async function prepareBrollClips({
  brollSuggestions,
  dimensions,
  tempDir,
  encodeOptions,
  durationSec = 4.0,
  runFFmpeg
}) {
  if (!brollSuggestions || brollSuggestions.length === 0) return [];
  const fsImport = await import("node:fs/promises");
  const fsModule = fsImport;

  const out = [];
  for (let i = 0; i < brollSuggestions.length; i++) {
    const sug = brollSuggestions[i];
    if (!sug?.videoUrl) continue;
    const localSrc = path.join(tempDir, `broll-src-${i}-${sug.categorySlug}.mp4`);
    const localOut = path.join(tempDir, `broll-${i}-${sug.categorySlug}.mp4`);
    try {
      await downloadToFile(sug.videoUrl, localSrc);
      await runFFmpeg([
        "-y",
        "-threads", "1",
        "-i", localSrc,
        "-vf",
          `scale=${dimensions.width}:${dimensions.height}:force_original_aspect_ratio=increase:flags=lanczos,` +
          `crop=${dimensions.width}:${dimensions.height},` +
          `fps=30`,
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", encodeOptions?.preset || "superfast",
        "-crf", encodeOptions?.crf || "19",
        "-x264-params", encodeOptions?.x264Params || "rc-lookahead=10:ref=2:bframes=2:keyint=60:scenecut=0",
        "-bufsize", encodeOptions?.bufsize || "2M",
        "-an",
        "-t", String(durationSec),
        localOut
      ], { timeoutMs: 90000, label: `broll:normalize-${i}` });
      out.push({ clipPath: localOut, suggestion: sug, durationSec });
      // Cleanup source download (only the normalized version is needed).
      await fsModule.unlink(localSrc).catch(() => {});
    } catch (err) {
      console.warn(`[broll] failed to prepare ${sug.categorySlug}: ${err.message}`);
      await fsModule.unlink(localSrc).catch(() => {});
    }
  }
  return out;
}

async function downloadToFile(url, destPath) {
  const fsImport = await import("node:fs/promises");
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} downloading B-roll`);
    const buf = Buffer.from(await res.arrayBuffer());
    await fsImport.writeFile(destPath, buf);
  } finally {
    clearTimeout(timer);
  }
}
