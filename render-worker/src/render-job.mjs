import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { createClient } from "@supabase/supabase-js";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const compositionId = "EstateMotionRender";

export async function renderEstateMotionJob({ manifest, requestedFormat = "vertical" }) {
  validateManifest(manifest);

  const jobId = createJobId(manifest);
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "estatemotion-"));
  const mp4Path = path.join(tempDir, `${jobId}.mp4`);
  const thumbnailPath = path.join(tempDir, `${jobId}.png`);
  const inputProps = {
    manifest,
    format: normalizeFormat(requestedFormat)
  };

  const entryPoint = path.join(dirname, "remotion-entry.jsx");
  const bundleLocation = await bundle({
    entryPoint,
    webpackOverride: (config) => config
  });

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: compositionId,
    inputProps
  });

  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation: mp4Path,
    inputProps,
    chromiumOptions: {
      ignoreCertificateErrors: true
    }
  });

  await renderStill({
    composition,
    serveUrl: bundleLocation,
    output: thumbnailPath,
    frame: Math.min(45, Math.max(0, composition.durationInFrames - 1)),
    inputProps
  });

  const upload = await uploadRenderAssets({ manifest, jobId, mp4Path, thumbnailPath });

  return {
    status: "complete",
    mock: false,
    jobId,
    mp4Url: upload.mp4Url,
    thumbnailUrl: upload.thumbnailUrl,
    storagePath: upload.storagePath,
    thumbnailPath: upload.thumbnailStoragePath,
    localMp4Path: upload.storageSkipped ? mp4Path : "",
    localThumbnailPath: upload.storageSkipped ? thumbnailPath : "",
    storageSkipped: upload.storageSkipped,
    storageWarning: upload.storageWarning || "",
    format: inputProps.format,
    durationInFrames: composition.durationInFrames
  };
}

function validateManifest(manifest) {
  if (!manifest || !Array.isArray(manifest.scenes) || manifest.scenes.length === 0) {
    throw new Error("Render manifest must include at least one scene.");
  }

  const photos = manifest.orderedPhotos || [];
  const missingDurableUrl = photos.some((photo) => !String(photo.durableUrl || photo.durable_url || photo.publicUrl || photo.public_url || ""));
  if (missingDurableUrl) {
    throw new Error("Live MP4 rendering requires durable Supabase image URLs on every ordered photo.");
  }
  const hasUnrenderableLocalUrl = photos.some((photo) => {
    const url = String(photo.durableUrl || photo.durable_url || photo.publicUrl || photo.public_url || photo.imageUrl || photo.uri || "");
    return url.startsWith("blob:") || url.startsWith("data:");
  });
  if (hasUnrenderableLocalUrl) {
    throw new Error("Live MP4 rendering requires Supabase/public image URLs. Browser blob/data URLs only work in MOCK_RENDERING mode.");
  }
}

function normalizeFormat(format) {
  const value = String(format || "vertical").toLowerCase();
  if (value === "9:16" || value === "reel" || value === "vertical") return "vertical";
  if (value === "1:1" || value === "square") return "square";
  if (value === "16:9" || value === "wide" || value === "youtube") return "wide";
  if (value === "mls") return "mls";
  return "vertical";
}

async function uploadRenderAssets({ manifest, jobId, mp4Path, thumbnailPath }) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const bucket = process.env.SUPABASE_GENERATED_VIDEOS_BUCKET || "generated-videos";

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      storageSkipped: true,
      storageWarning: "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to upload rendered videos."
    };
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const ownerId = slug(manifest.project?.userId || manifest.project?.id || "demo");
  const basePath = `${ownerId}/generated/${jobId}`;
  const storagePath = `${basePath}/estate-motion.mp4`;
  const thumbnailStoragePath = `${basePath}/thumbnail.png`;

  const mp4Buffer = await fs.readFile(mp4Path);
  const thumbnailBuffer = await fs.readFile(thumbnailPath);

  const videoUpload = await supabase.storage.from(bucket).upload(storagePath, mp4Buffer, {
    contentType: "video/mp4",
    upsert: true
  });
  if (videoUpload.error) throw new Error(videoUpload.error.message);

  const thumbUpload = await supabase.storage.from(bucket).upload(thumbnailStoragePath, thumbnailBuffer, {
    contentType: "image/png",
    upsert: true
  });
  if (thumbUpload.error) throw new Error(thumbUpload.error.message);

  return {
    storageSkipped: false,
    storagePath,
    thumbnailStoragePath,
    mp4Url: supabase.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl,
    thumbnailUrl: supabase.storage.from(bucket).getPublicUrl(thumbnailStoragePath).data.publicUrl
  };
}

function createJobId(manifest) {
  const projectId = manifest.project?.id || manifest.project?.title || "estate-motion";
  return `${slug(projectId)}-${Date.now()}`;
}

function slug(value) {
  return String(value || "render").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "render";
}
