# EstateMotion render worker — Remotion + (future) Runway/FFmpeg pipeline.
# Tested on Render.com Standard plan (2GB RAM, 1 CPU). Starter plan WILL OOM.

FROM node:20-bookworm-slim

WORKDIR /app

# System deps:
#   - Chromium runtime libraries (Remotion downloads Chromium itself but needs
#     these shared libs to run it headless)
#   - ffmpeg for stitching Runway clips and applying transitions/audio in the
#     Cinematic AI tier
#   - fonts so Remotion text overlays render correctly without falling back to
#     blank squares
#   - ca-certificates for HTTPS to Supabase, OpenAI, and Runway
#   - X11 dev libs + pkg-config + build-essential + python3 so the `gl`
#     npm package (headless WebGL for Cinematic Depth engine) compiles
#     its native binding from source on first install. Without these the
#     npm install step fails with "Package xi was not found in the
#     pkg-config search path" (Render.com build log signature).
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    ffmpeg \
    fonts-liberation \
    fonts-noto-color-emoji \
    libnss3 \
    libnspr4 \
    libgbm1 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libxshmfence1 \
    libxss1 \
    libxtst6 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    libdbus-1-3 \
    libxi-dev \
    libxext-dev \
    libx11-dev \
    libglu1-mesa-dev \
    libglew-dev \
    pkg-config \
    build-essential \
    python3 \
    xvfb \
    mesa-utils \
  && rm -rf /var/lib/apt/lists/*

# Install dependencies first (cached layer when only source changes).
# Using `npm install` instead of `npm ci` because the lock file isn't
# regenerated for every package.json change in the sandbox where edits
# happen. `npm install` tolerates the drift; `npm ci` errors out the
# moment lock != package.json (which broke this build when sharp, gl,
# and three were added to package.json without a matching lock update).
# To restore `npm ci` later: regenerate package-lock.json locally with
# `cd render-worker && rm -rf node_modules package-lock.json && npm install`,
# commit the new lock, then swap this RUN back to `npm ci --omit=dev`.
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund

# Copy source.
COPY . .

# Pre-warm Remotion's Chromium download at build time so the first render
# doesn't have to download ~150MB on a cold container.
RUN node -e "require('@remotion/renderer').ensureBrowser().then(() => console.log('Chromium ready')).catch(err => { console.error(err); process.exit(1); })"

ENV PORT=8787
ENV NODE_ENV=production
# DISPLAY=:99 points the gl npm package at the Xvfb virtual framebuffer
# we launch via xvfb-run in CMD below. Without Xvfb, createGL() returns
# null on the headless container because there's no X server for ANGLE
# to attach to. Cinematic Depth (which needs headless WebGL) requires
# this to function; Runway + Quick Reel don't read DISPLAY.
ENV DISPLAY=:99
EXPOSE 8787

# Health check — Render.com uses this to decide if the container is alive.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||8787)+'/health',r=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

# xvfb-run starts a virtual X server on display :99 with a 1920x1080
# RGBA screen, exports DISPLAY=:99 for the child process, then exec's
# node server.mjs. The -a flag auto-picks a free display number if :99
# is somehow taken. -s gives Xvfb its arguments. xvfb-run is the
# idiomatic way to run X-dependent programs without a real GPU/display
# and works fine for long-running services — it just keeps the X server
# alive for the lifetime of the child process.
CMD ["xvfb-run", "-a", "-s", "-screen 0 1920x1080x24", "node", "server.mjs"]
