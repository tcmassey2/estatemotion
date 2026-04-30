import http from "node:http";
import { renderEstateMotionJob } from "./src/render-job.mjs";

const port = Number(process.env.PORT || 8787);
const maxBodyBytes = 25 * 1024 * 1024;

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

  if (request.method !== "POST" || request.url !== "/render") {
    sendJson(response, 404, { status: "failed", error: "Use POST /render." });
    return;
  }

  if (!authorized(request)) {
    sendJson(response, 401, { status: "failed", error: "Render worker authorization failed." });
    return;
  }

  try {
    const body = await readJsonBody(request);
    const result = await renderEstateMotionJob(body);
    sendJson(response, 200, result);
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
