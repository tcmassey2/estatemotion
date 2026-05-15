// EstateMotion — Address opener card (Runway/ffmpeg side, v23).
//
// Generates a 3.5s opening clip with the property address + price over
// a slow-zoomed hero photo. Match for the Remotion AddressOpenerCard
// component, but built via ffmpeg drawtext + zoompan because the Runway
// pipeline doesn't go through a JSX render — it stitches per-scene MP4s.
//
// Output is a normalized MP4 with the same dimensions / framerate /
// encoding as the post-normalize scene clips, so it slots into the
// concat demuxer transparently.
//
// Composition (top-to-bottom):
//   1. Hero photo with zoompan (1.00 → 1.08 over duration)
//   2. Dark vertical gradient overlay (top + bottom darker)
//   3. Accent radial gradient at lower-left
//   4. "FOR SALE" / style-pack label, top-left, with accent border
//   5. Address (large, bottom-left, fade in at 0.4s)
//   6. Price (accent color, fade in at 1.5s)
//   7. Stats row (BD / BA / SQFT, fade in at 2.2s)
//
// Failure mode: if hero image can't be downloaded or ffmpeg errors,
// returns null. Caller skips the address card and proceeds with the
// normal first scene.

import fs from "node:fs/promises";
import path from "node:path";
import { runFFmpeg } from "./ffmpeg-runner.mjs";

const ADDRESS_CARD_DURATION_SEC = 3.5;
const FPS = 30;

// Find a usable font on the system. Render.com / Ubuntu has DejaVu and
// Liberation pre-installed. macOS has different fonts. We try a list and
// use the first one that exists. ffmpeg drawtext requires fontfile= for
// reliable rendering — system font lookup via fontconfig is unreliable.
const CANDIDATE_FONTS = [
  // Linux (Ubuntu/Debian — Render.com default)
  "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
  "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
  "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf",
  "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
  "/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf",
  // macOS (local dev)
  "/System/Library/Fonts/Helvetica.ttc",
  "/Library/Fonts/Arial Bold.ttf"
];

const CANDIDATE_SERIF_FONTS = [
  "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
  "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf",
  "/usr/share/fonts/truetype/freefont/FreeSerifBold.ttf",
  "/System/Library/Fonts/Times.ttc",
  "/Library/Fonts/Times New Roman Bold.ttf"
];

async function pickFirstExisting(candidates) {
  for (const p of candidates) {
    try {
      await fs.access(p);
      return p;
    } catch {}
  }
  return null;
}

// drawtext text-arg escaping. Single quotes wrap, but content can't contain
// single quotes or backslashes literally — they must be escaped per ffmpeg
// filter rules. Also colons and percents need escaping inside the value.
function escapeDrawtext(text) {
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "’")    // turn apostrophes into curly quotes (typographically nicer anyway)
    .replace(/:/g, "\\:")
    .replace(/%/g, "\\%");
}

/* ============================================================
   Public entry: buildAddressCardClip
   ============================================================
   Returns the path to an MP4 ready to slot into the concat demuxer,
   or null if generation failed.

   Inputs:
     project    — manifest.project (has address, price, beds, baths, squareFeet)
     brandKit   — manifest.brandKit (for accent color fallback)
     manifest   — full manifest (for style + accent + opt-out flag)
     dimensions — { width, height } of the render
     heroImage  — local path OR public URL of the first photo
     tempDir    — where to write the output
     accentColor — primary accent (default #C7A76C)
     encodeOptions — { preset, crf, x264Params, bufsize }
*/
export async function buildAddressCardClip({
  project,
  brandKit,
  manifest,
  dimensions,
  heroImage,
  tempDir,
  accentColor,
  encodeOptions
}) {
  if (manifest?.disableAddressCard) return null;
  if (!heroImage) return null;
  if (!dimensions?.width || !dimensions?.height) return null;

  const accent = accentColor || project?.accentColor || brandKit?.accentColor || "#C7A76C";
  const styleSlug = String(
    manifest?.selectedStyle || manifest?.template?.style || "luxury"
  ).trim().toLowerCase();
  const isSerif = styleSlug === "luxury" || styleSlug === "investor";
  const sansFont = await pickFirstExisting(CANDIDATE_FONTS);
  const serifFont = await pickFirstExisting(CANDIDATE_SERIF_FONTS);
  const headlineFont = isSerif ? (serifFont || sansFont) : sansFont;
  const bodyFont = sansFont || serifFont;
  if (!headlineFont || !bodyFont) {
    console.warn("[address-card] no system fonts available for drawtext — skipping address card");
    return null;
  }

  const isVertical = dimensions.height > dimensions.width;
  const sidePad = isVertical ? 64 : 96;
  const labelTop = isVertical ? 168 : 96;
  const addressBottom = isVertical ? 480 : 320;
  const addressFontSize = isVertical
    ? Math.min(96, Math.max(60, Math.floor(dimensions.width / Math.max(8, (project?.address || "").length / 1.6))))
    : 78;
  const priceFontSize = Math.round(addressFontSize * 0.62);
  const labelFontSize = 22;
  const statsFontSize = 24;

  const addressText = escapeDrawtext(project?.address || project?.title || "Featured listing");
  const priceText = escapeDrawtext(project?.price || "");
  const labelText = escapeDrawtext(project?.justListed ? "JUST LISTED" : "NOW SHOWING");
  const statsParts = [
    project?.beds ? `${project.beds} BD` : "",
    project?.baths ? `${project.baths} BA` : "",
    project?.squareFeet ? `${project.squareFeet} SQFT` : ""
  ].filter(Boolean);
  const statsText = escapeDrawtext(statsParts.join("    "));

  const accentHex = accent.replace("#", "");

  // Filter chain (one big -filter_complex):
  //   [0:v]scale...,zoompan...           → hero with slow zoom
  //   ,format=yuva420p
  //   ,drawbox dark gradient top
  //   ,drawbox dark gradient bottom (heavier)
  //   ,drawbox accent radial-ish (using crop+overlay would be heavier — skip for v1)
  //   ,drawtext label (top-left, with box, fade-in)
  //   ,drawtext address (bottom area, large, fade-in)
  //   ,drawtext price (below address, accent color, later fade-in)
  //   ,drawtext stats (below price, monospace-feel, latest fade-in)
  //
  // zoompan note: zoompan operates on stills — we feed the photo as -loop 1
  // so it streams as a video, then zoompan animates the framing.
  const totalFrames = Math.round(ADDRESS_CARD_DURATION_SEC * FPS);

  const drawLabel =
    `drawtext=fontfile='${bodyFont}':text='${labelText}'` +
    `:fontcolor=0x${accentHex}` +
    `:fontsize=${labelFontSize}` +
    `:box=1:boxcolor=0x000000@0.32:boxborderw=14` +
    `:bordercolor=0x${accentHex}:borderw=2` +
    `:x=${sidePad}:y=${labelTop}` +
    `:alpha='if(lt(t,0.4),t/0.4,1)'`;

  // Address fade-in 0.4s → 1.2s
  const drawAddress =
    `drawtext=fontfile='${headlineFont}':text='${addressText}'` +
    `:fontcolor=white:fontsize=${addressFontSize}` +
    `:x=${sidePad}:y=h-${addressBottom}` +
    `:shadowcolor=0x000000@0.7:shadowx=0:shadowy=4` +
    `:alpha='if(lt(t,0.4),0,if(lt(t,1.2),(t-0.4)/0.8,1))'`;

  // Price fade-in 1.5s → 2.0s
  const drawPrice = priceText
    ? `,drawtext=fontfile='${headlineFont}':text='${priceText}'` +
      `:fontcolor=0x${accentHex}:fontsize=${priceFontSize}` +
      `:x=${sidePad}:y=h-${addressBottom - addressFontSize - 24}` +
      `:shadowcolor=0x000000@0.6:shadowx=0:shadowy=3` +
      `:alpha='if(lt(t,1.5),0,if(lt(t,2.0),(t-1.5)/0.5,1))'`
    : "";

  // Stats fade-in 2.2s → 2.7s
  const drawStats = statsText
    ? `,drawtext=fontfile='${bodyFont}':text='${statsText}'` +
      `:fontcolor=white:fontsize=${statsFontSize}` +
      `:x=${sidePad}:y=h-${addressBottom - addressFontSize - priceFontSize - 56}` +
      `:box=1:boxcolor=0xffffff@0.10:boxborderw=10` +
      `:alpha='if(lt(t,2.2),0,if(lt(t,2.7),(t-2.2)/0.5,1))'`
    : "";

  // Card-wide exit fade in last 0.33s for smooth transition into scene 1
  const exitFade = `fade=t=out:st=${(ADDRESS_CARD_DURATION_SEC - 0.33).toFixed(2)}:d=0.33`;

  // Vignette: simple top + bottom drawbox with semi-opaque black
  const topDarken = `drawbox=x=0:y=0:w=iw:h=ih*0.32:color=0x000000@0.42:t=fill`;
  const bottomDarken = `drawbox=x=0:y=ih*0.55:w=iw:h=ih*0.45:color=0x000000@0.62:t=fill`;

  const filterComplex =
    `[0:v]scale=${dimensions.width * 1.12}:${dimensions.height * 1.12}:force_original_aspect_ratio=increase,` +
    `crop=${dimensions.width * 1.12}:${dimensions.height * 1.12},` +
    `zoompan=z='min(zoom+0.0006,1.08)':d=${totalFrames}:s=${dimensions.width}x${dimensions.height}:fps=${FPS},` +
    `format=yuv420p,` +
    `${topDarken},${bottomDarken},` +
    `${drawLabel},` +
    `${drawAddress}` +
    `${drawPrice}` +
    `${drawStats},` +
    `${exitFade}[vout]`;

  const outPath = path.join(tempDir, "address-card.mp4");

  // -loop 1 + -t makes the still photo into a 3.5s clip
  const args = [
    "-y",
    "-threads", "1",
    "-loop", "1",
    "-i", heroImage,
    "-filter_complex", filterComplex,
    "-map", "[vout]",
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-preset", encodeOptions?.preset || "superfast",
    "-crf", encodeOptions?.crf || "19",
    "-x264-params", encodeOptions?.x264Params || "rc-lookahead=10:ref=2:bframes=2:keyint=60:scenecut=0",
    "-bufsize", encodeOptions?.bufsize || "2M",
    "-t", String(ADDRESS_CARD_DURATION_SEC),
    "-an",
    "-r", String(FPS),
    outPath
  ];

  try {
    await runFFmpeg(args, { timeoutMs: 90000, label: "address-card:render" });
    return outPath;
  } catch (err) {
    console.warn(`[address-card] render failed (${err.message}). Continuing without address card.`);
    return null;
  }
}

export const ADDRESS_CARD_SECONDS = ADDRESS_CARD_DURATION_SEC;
