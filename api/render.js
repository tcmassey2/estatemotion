const DEFAULT_TIMEOUT_MS = 1000 * 60 * 8;

export default async function handler(request, response) {
  setCorsHeaders(response);

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  if (request.method !== "POST") {
    response.status(405).json({ status: "failed", error: "Use POST /api/render with an EstateMotion render manifest." });
    return;
  }

  try {
    const body = parseBody(request.body);
    const manifest = body.manifest;

    if (!manifest || !Array.isArray(manifest.scenes) || manifest.scenes.length === 0) {
      response.status(400).json({ status: "failed", error: "Render manifest is missing scenes." });
      return;
    }

    const manifestError = validateManifestForServerRender(manifest, { live: !readFlag("MOCK_RENDERING", true) });
    if (manifestError) {
      response.status(400).json({ status: "failed", error: manifestError });
      return;
    }

    if (readFlag("MOCK_RENDERING", true)) {
      response.status(200).json({
        status: "complete",
        mock: true,
        jobId: createJobId(manifest),
        message: "MOCK_RENDERING=true. EstateMotion kept the render in mock mode and did not call Remotion.",
        mp4Url: "",
        thumbnailUrl: ""
      });
      return;
    }

    const workerUrl = renderWorkerUrl();
    if (!workerUrl) {
      response.status(503).json({
        status: "failed",
        error: "Live rendering is enabled, but RENDER_WORKER_URL or RENDER_ENDPOINT is not configured."
      });
      return;
    }

    const workerResponse = await fetchWithTimeout(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.RENDER_WEBHOOK_SECRET ? { Authorization: `Bearer ${process.env.RENDER_WEBHOOK_SECRET}` } : {})
      },
      body: JSON.stringify({
        manifest,
        jobs: body.jobs || [],
        requestedFormat: body.requestedFormat || "vertical"
      })
    }, DEFAULT_TIMEOUT_MS);

    const text = await workerResponse.text();
    const payload = parseBody(text);

    response.status(workerResponse.status).json(payload || {
      status: workerResponse.ok ? "complete" : "failed",
      message: text
    });
  } catch (error) {
    response.status(500).json({
      status: "failed",
      error: error.message || "EstateMotion render request failed."
    });
  }
}

function setCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function parseBody(body) {
  if (!body) return {};
  if (typeof body === "object") return body;
  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
}

function readFlag(key, fallback) {
  const value = process.env[key];
  if (value === undefined || value === null || value === "") return fallback;
  return value === true || value === "true" || value === "1";
}

function renderWorkerUrl() {
  const configured = process.env.RENDER_WORKER_URL || process.env.RENDER_ENDPOINT || "";
  if (!configured) return "";
  return configured.endsWith("/render") ? configured : `${configured.replace(/\/$/, "")}/render`;
}

function validateManifestForServerRender(manifest, options = {}) {
  const photos = new Map((manifest.orderedPhotos || []).map((photo) => [photo.id, photo]));
  const problems = [];
  manifest.scenes.forEach((scene, index) => {
    if (["title", "intro", "outro", "card"].includes(String(scene.type || "").toLowerCase())) return;
    const label = scene.fileName || `scene ${index + 1}`;
    const imageUrl = scene.durableUrl || scene.durable_url || scene.publicUrl || scene.public_url || scene.imageUrl || "";
    if (!scene.photoId) problems.push(`${label} is missing photoId.`);
    if (scene.photoId && photos.size && !photos.has(scene.photoId)) problems.push(`${label} is not present in orderedPhotos.`);
    if (!imageUrl) problems.push(`${label} is missing imageUrl.`);
    if (options.live && !(scene.durableUrl || scene.durable_url)) problems.push(`${label} is missing durableUrl.`);
    if (options.live && isLocalOnlyUrl(imageUrl)) problems.push(`${label} uses a browser-only image URL.`);
    if (isUnsupportedImageUrl(imageUrl)) problems.push(`${label} uses an unsupported image format.`);
    if (isLikelyExpiredImageUrl(imageUrl)) problems.push(`${label} appears to use an expired signed URL.`);
  });
  if (!problems.length) return "";
  return `Render manifest validation failed: ${problems.slice(0, 3).join(" ")}${problems.length > 3 ? ` ${problems.length - 3} more issue${problems.length - 3 === 1 ? "" : "s"} found.` : ""}`;
}

function isLocalOnlyUrl(url) {
  const value = String(url || "");
  return value.startsWith("blob:") || value.startsWith("data:");
}

function isUnsupportedImageUrl(url) {
  const value = String(url || "").toLowerCase();
  if (value.startsWith("data:")) {
    return !value.startsWith("data:image/jpeg") && !value.startsWith("data:image/jpg") && !value.startsWith("data:image/png") && !value.startsWith("data:image/webp");
  }
  const path = value.split("?")[0];
  return /\.(heic|heif|tif|tiff|bmp|svg|gif)$/i.test(path);
}

function isLikelyExpiredImageUrl(url) {
  try {
    const parsed = new URL(String(url));
    const rawExpiry = parsed.searchParams.get("expires") || parsed.searchParams.get("expires_at") || parsed.searchParams.get("expiry") || parsed.searchParams.get("exp");
    if (!rawExpiry) return false;
    const numeric = Number(rawExpiry);
    const expiresAt = Number.isFinite(numeric)
      ? new Date(numeric < 10000000000 ? numeric * 1000 : numeric)
      : new Date(rawExpiry);
    return Number.isFinite(expiresAt.getTime()) && expiresAt.getTime() <= Date.now();
  } catch {
    return false;
  }
}

function createJobId(manifest) {
  const projectId = manifest.project?.id || manifest.project?.title || "estate-motion";
  return `${slug(projectId)}-${Date.now()}`;
}

function slug(value) {
  return String(value || "render").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}
