import { RenderInput } from "./renderTypes";

export async function buildFfmpegCommand(input: RenderInput) {
  const size = input.format === "9:16" ? "1080x1920" : input.format === "1:1" ? "1080x1080" : "1920x1080";
  const imageInputs = input.photos.map((photo) => `-loop 1 -t 3 -i \"${photo.uri}\"`).join(" ");
  const filterSteps = input.photos
    .map((_, index) => `[${index}:v]scale=${size}:force_original_aspect_ratio=increase,crop=${size},zoompan=z='min(zoom+0.0015,1.08)':d=90:s=${size}[v${index}]`)
    .join(";");
  const concatInputs = input.photos.map((_, index) => `[v${index}]`).join("");

  return [
    "ffmpeg",
    imageInputs,
    `-filter_complex \"${filterSteps};${concatInputs}concat=n=${input.photos.length}:v=1:a=0,format=yuv420p[outv]\"`,
    "-map \"[outv]\"",
    "-movflags +faststart",
    `\"${input.outputName}\"`
  ].join(" ");
}

export async function renderWithFfmpeg(input: RenderInput) {
  // Production TODO: run this in a server worker with downloaded Supabase Storage assets.
  return {
    command: await buildFfmpegCommand(input),
    status: "queued"
  };
}
