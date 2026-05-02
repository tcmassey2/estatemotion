import http from "node:http";
import { renderEstateMotionJob } from "./src/render-job.mjs";

const port = Number(process.env.PORT || 8787);
const maxBodyBytes = 25 * 1024 * 1024;
const jobs = new Map();
const jobAssets = new Map();

const server = http.createServer(async (request, response) => {
  setCorsHeaders(response);

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.method === "GET" && request.url === "/health") {
    sendJson(response, 200, { ok: true, service: "EstateMotion Remotion worker" });
    return;
  }

  if (request.method === "GET" && request.url?.startsWith("/render/assets/")) {
    await serveRenderAsset(request, response);
    return;
  }

  if (request.method === "GET" && request.url?.startsWith("/render/status/")) {
    const jobId = decodeURIComponent(request.url.split("/").pop() || "");
    const job = jobs.get(jobId);
    if (!job) {
      sendJson(response, 404, { status: "failed", error: "Render job was not found. It may have expired or the worker restarted." });
      return;
    }
    sendJson(response, 200, job);
    return;
  }

  if (request.method !== "POST" || !["/render", "/render/sync"].includes(request.url || "")) {
    sendJson(response, 404, { status: "failed", error: "Use POST /render or GET /render/status/:jobId." });
    return;
  }

  if (!authorized(request)) {
    sendJson(response, 401, { status: "failed", error: "Render worker authorization failed." });
    return;
  }

  try {
    const body = await readJsonBody(request);
    if (request.url === "/render/sync") {
      const result = await renderEstateMotionJob(body);
      sendJson(response, 200, publishLocalAssetUrls(result));
      return;
    }
    const jobId = createJobId(body.manifest);
    const now = new Date().toISOString();
    const job = {
      status: "queued",
      phase: "Preparing video",
      progress: 5,
      jobId,
      mp4Url: "",
      thumbnailUrl: "",
      error: "",
      createdAt: now,
      updatedAt: now
    };
    jobs.set(jobId, job);
    sendJson(response, 202, job);
    runRenderJob(jobId, body);
  } catch (error) {
    sendJson(response, 500, {
      status: "failed",
      error: error.message || "EstateMotion render worker failed."
    });
  }
});

server.listen(port, () => {
  console.log(`EstateMotion render worker listening on http://localhost:${port}`);
});

function authorized(request) {
  const secret = process.env.RENDER_WORKER_SECRET || process.env.RENDER_WEBHOOK_SECRET || "";
  if (!secret) return true;
  return request.headers.authorization === `Bearer ${secret}`;
}

function setCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

async function runRenderJob(jobId, body) {
  updateJob(jobId, { status: "rendering", phase: "Rendering scenes", progress: 28 });
  try {
    const result = await renderEstateMotionJob(body, { jobId, onProgress: (patch) => updateJob(jobId, patch) });
    const publishedResult = publishLocalAssetUrls(result);
    updateJob(jobId, {
      ...publishedResult,
      status: "completed",
      phase: "Ready to download",
      progress: 100,
      jobId
    });
  } catch (error) {
    updateJob(jobId, {
      status: "failed",
      phase: "Render failed",
      progress: 100,
      error: error.message || "EstateMotion render worker failed."
    });
  }
}

function updateJob(jobId, patch) {
  const current = jobs.get(jobId) || { jobId };
  jobs.set(jobId, {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString()
  });
}

function publishLocalAssetUrls(result = {}) {
  if (!result.storageSkipped || !result.localMp4Path) return result;
  const publicBase = (process.env.RENDER_WORKER_PUBLIC_URL || `http://localhost:${port}`).replace(/\/$/, "");
  jobAssets.set(result.jobId, {
    mp4Path: result.localMp4Path,
    thumbnailPath: result.localThumbnailPath || ""
  });
  return {
    ...result,
    mp4Url: `${publicBase}/render/assets/${encodeURIComponent(result.jobId)}/estate-motion.mp4`,
    thumbnailUrl: result.localThumbnailPath ? `${publicBase}/render/assets/${encodeURIComponent(result.jobId)}/thumbnail.png` : ""
  };
}

async function serveRenderAsset(request, response) {
  const parts = (request.url || "").split("/");
  const jobId = decodeURIComponent(parts[3] || "");
  const fileName = parts[4] || "";
  const asset = jobAssets.get(jobId);
  const filePath = fileName === "thumbnail.png" ? asset?.thumbnailPath : asset?.mp4Path;
  if (!asset || !filePath) {
    sendJson(response, 404, { status: "failed", error: "Rendered asset was not found. It may have expired or the worker restarted." });
    return;
  }
  try {
    const { default: fs } = await import("node:fs/promises");
    const body = await fs.readFile(filePath);
    response.writeHead(200, {
      "Content-Type": fileName === "thumbnail.png" ? "image/png" : "video/mp4",
      "Content-Length": body.length,
      "Cache-Control": "no-store"
    });
    response.end(body);
  } catch (error) {
    sendJson(response, 404, { status: "failed", error: error.message || "Rendered asset could not be read." });
  }
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let raw = "";
    request.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > maxBodyBytes) {
        reject(new Error("Render request body is too large."));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("Render request body must be valid JSON."));
      }
    });
    request.on("error", reject);
  });
}

function createJobId(manifest = {}) {
  const projectId = manifest.project?.id || manifest.project?.title || "estate-motion";
  return `${slug(projectId)}-${Date.now()}`;
}

function slug(value) {
  return String(value || "render").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "render";
}
