const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-4.1-mini";
const DEFAULT_TIMEOUT_MS = 25000;
const OPENAI_PHOTO_LIMIT = 3;

const ROOM_TYPES = ["exterior", "kitchen", "living", "bedroom", "bathroom", "outdoor", "amenity", "detail"];
const CAMERA_MOTIONS = ["push_in", "pull_out", "lateral_pan", "vertical_reveal", "parallax_zoom", "detail_sweep"];
const TRANSITIONS = ["crossfade", "blur_wipe", "whip_pan", "match_cut", "light_leak"];

export default async function handler(request, response) {
  setCorsHeaders(response);

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  if (request.method !== "POST") {
    response.status(405).json({ status: "failed", error: "Use POST /api/create-edit-plan." });
    return;
  }

  const body = parseBody(request.body);
  const rawPhotos = Array.isArray(body.photos) ? body.photos : [];
  const invalidPhotoUrls = invalidInputPhotos(rawPhotos);
  if (invalidPhotoUrls.length) {
    logMotionDirector("warn", "invalid photo URLs rejected", {
      count: invalidPhotoUrls.length,
      ids: invalidPhotoUrls.map((photo) => photo.id).slice(0, 12)
    });
  }
  const photos = normalizeInputPhotos(rawPhotos);
  const requestPhotos = photos.slice(0, OPENAI_PHOTO_LIMIT);
  const listingDetails = normalizeListingDetails(body.listingDetails || {});
  const selectedStyle = String(body.selectedStyle || "Cinematic Luxury");
  const exportFormat = String(body.exportFormat || "vertical");

  if (photos.length < 3) {
    const error = invalidPhotoUrls.length
      ? `Motion Director needs at least 3 durable public or signed listing photo URLs. ${invalidPhotoUrls.length} photo URL${invalidPhotoUrls.length === 1 ? " was" : "s were"} local, temporary, or missing.`
      : "Motion Director needs at least 3 uploaded listing photos.";
    logMotionDirector("warn", "fallback unavailable: fewer than 3 valid photos", {
      validPhotoCount: photos.length,
      invalidPhotoCount: invalidPhotoUrls.length,
      category: invalidPhotoUrls.length ? "invalid_photo_urls" : "too_few_photos"
    });
    response.status(400).json({
      status: "failed",
      error,
      errorCategory: invalidPhotoUrls.length ? "invalid_photo_urls" : "too_few_photos"
    });
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    const reason = "Motion Director unavailable: missing OPENAI_API_KEY.";
    logMotionDirector("warn", "fallback reason", { category: "missing_openai_api_key", reason, validPhotoCount: photos.length });
    response.status(200).json({
      status: "fallback",
      reason,
      errorCategory: "missing_openai_api_key",
      editPlan: deterministicEditPlan({ photos, listingDetails, selectedStyle, exportFormat })
    });
    return;
  }

  try {
    const urlCheck = await validateRemotePhotos(requestPhotos);
    if (!urlCheck.valid) {
      const reason = `Motion Director unavailable: ${urlCheck.reason}`;
      logMotionDirector("warn", "invalid photo URLs rejected before OpenAI", {
        category: "inaccessible_image_url",
        reason,
        invalidPhotos: urlCheck.invalidPhotos
      });
      response.status(200).json({
        status: "fallback",
        reason,
        errorCategory: "inaccessible_image_url",
        editPlan: deterministicEditPlan({ photos, listingDetails, selectedStyle, exportFormat })
      });
      return;
    }

    logMotionDirector("info", "OpenAI request started", {
      photoCount: photos.length,
      openaiPhotoCount: requestPhotos.length,
      selectedStyle,
      exportFormat,
      model: motionModel(),
      timeoutMs: Number(process.env.OPENAI_MOTION_DIRECTOR_TIMEOUT_MS || DEFAULT_TIMEOUT_MS)
    });

    const openaiResponse = await fetchWithTimeout(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(buildOpenAIRequest({ photos: requestPhotos, listingDetails, selectedStyle, exportFormat }))
    }, Number(process.env.OPENAI_MOTION_DIRECTOR_TIMEOUT_MS || DEFAULT_TIMEOUT_MS));

    const payload = await openaiResponse.json().catch(() => ({}));
    if (!openaiResponse.ok) {
      const openaiError = extractOpenAIError(openaiResponse, payload);
      const reason = userFacingOpenAIReason(openaiError);
      logMotionDirector("error", "OpenAI request failed; fallback used", openaiError);
      response.status(200).json({
        status: "fallback",
        reason,
        errorCategory: openaiError.category,
        requestId: openaiError.requestId,
        editPlan: deterministicEditPlan({ photos, listingDetails, selectedStyle, exportFormat })
      });
      return;
    }

    const parsed = parseOpenAIJson(payload);
    const validation = validateEditPlan(parsed, requestPhotos);
    if (!validation.valid) {
      logMotionDirector("warn", "JSON parse/validation failure; fallback used", {
        category: "schema_validation",
        reason: validation.error,
        outputId: payload.id || ""
      });
      response.status(200).json({
        status: "fallback",
        reason: `Motion Director unavailable: schema validation failed. ${validation.error}`,
        errorCategory: "schema_validation",
        editPlan: deterministicEditPlan({ photos, listingDetails, selectedStyle, exportFormat })
      });
      return;
    }

    logMotionDirector("info", "OpenAI request succeeded", {
      sceneCount: parsed.scenes?.length || 0,
      heroPhotoId: parsed.heroPhotoId
    });
    response.status(200).json({
      status: "complete",
      editPlan: normalizeEditPlan(parsed, photos, { listingDetails, selectedStyle, exportFormat })
    });
  } catch (error) {
    const category = error.name === "AbortError" ? "timeout" : "openai_exception";
    const reason = error.name === "AbortError" ? "Motion Director unavailable: OpenAI timed out." : `Motion Director unavailable: ${error.message || "OpenAI request failed."}`;
    logMotionDirector("error", "OpenAI request exception; fallback used", {
      category,
      message: error.message || "",
      name: error.name || ""
    });
    response.status(200).json({
      status: "fallback",
      reason,
      errorCategory: category,
      editPlan: deterministicEditPlan({ photos, listingDetails, selectedStyle, exportFormat })
    });
  }
}

function buildOpenAIRequest({ photos, listingDetails, selectedStyle, exportFormat }) {
  const capped = photos.slice(0, OPENAI_PHOTO_LIMIT);
  return {
    model: motionModel(),
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: [
              "You are EstateMotion Motion Director, a professional real estate video editor.",
              "Create a cinematic edit plan from uploaded listing photos only.",
              "Never invent property features, views, amenities, upgrades, materials, or room names.",
              "Only describe visible image details or user-provided listing facts.",
              `Allowed roomType values: ${ROOM_TYPES.join(", ")}.`,
              `Allowed cameraMotion values: ${CAMERA_MOTIONS.join(", ")}.`,
              `Allowed transition values: ${TRANSITIONS.join(", ")}.`,
              "Prefer vertical 9:16 pacing. Build a professional property-tour order: exterior, kitchen, living, bedrooms, baths, outdoor/amenity, detail/outro.",
              "Return strict JSON only."
            ].join(" ")
          }
        ]
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: JSON.stringify({
              listingDetails,
              selectedStyle,
              exportFormat,
              photos: capped.map((photo, index) => ({
                id: photo.id,
                fileName: photo.fileName,
                uploadOrder: index + 1
              }))
            })
          },
          ...capped.flatMap((photo) => [
            {
              type: "input_text",
              text: `Photo ID: ${photo.id}. Filename: ${photo.fileName}. Use this exact ID if selected.`
            },
            {
              type: "input_image",
              image_url: photo.url,
              detail: "low"
            }
          ])
        ]
      }
    ],
    text: {
      format: editPlanTextFormat(capped.map((photo) => photo.id))
    },
    temperature: 0.2,
    max_output_tokens: 1600
  };
}

function motionModel() {
  return process.env.OPENAI_MOTION_MODEL || process.env.OPENAI_MOTION_DIRECTOR_MODEL || DEFAULT_MODEL;
}

function editPlanTextFormat(photoIds) {
  return {
    type: "json_schema",
    name: "estate_motion_edit_plan",
    strict: true,
    schema: editPlanSchema(photoIds)
  };
}

function editPlanSchema(photoIds) {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      heroPhotoId: { type: "string", enum: photoIds },
      exportFormat: { type: "string" },
      selectedStyle: { type: "string" },
      musicMood: { type: "string" },
      introCard: {
        type: "object",
        additionalProperties: false,
        properties: {
          headline: { type: "string" },
          subline: { type: "string" }
        },
        required: ["headline", "subline"]
      },
      outroCard: {
        type: "object",
        additionalProperties: false,
        properties: {
          headline: { type: "string" },
          subline: { type: "string" }
        },
        required: ["headline", "subline"]
      },
      scenes: {
        type: "array",
        minItems: 3,
        maxItems: 12,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            photoId: { type: "string", enum: photoIds },
            order: { type: "integer", minimum: 1, maximum: 25 },
            roomType: { type: "string", enum: ROOM_TYPES },
            visibleFeatures: {
              type: "array",
              maxItems: 5,
              items: { type: "string" }
            },
            qualityScore: { type: "number", minimum: 0, maximum: 100 },
            duration: { type: "number", minimum: 1.2, maximum: 5 },
            cameraMotion: { type: "string", enum: CAMERA_MOTIONS },
            transition: { type: "string", enum: TRANSITIONS },
            overlay: {
              type: "object",
              additionalProperties: false,
              properties: {
                headline: { type: "string" },
                subline: { type: "string" }
              },
              required: ["headline", "subline"]
            }
          },
          required: ["photoId", "order", "roomType", "visibleFeatures", "qualityScore", "duration", "cameraMotion", "transition", "overlay"]
        }
      }
    },
    required: ["heroPhotoId", "exportFormat", "selectedStyle", "musicMood", "introCard", "outroCard", "scenes"]
  };
}

function deterministicEditPlan({ photos, listingDetails, selectedStyle, exportFormat }) {
  const ranked = photos
    .map((photo, index) => ({
      ...photo,
      roomType: inferRoomType(photo, index),
      qualityScore: qualityScore(photo, index)
    }))
    .sort((a, b) => roomRank(a.roomType) - roomRank(b.roomType) || b.qualityScore - a.qualityScore);
  const unique = [];
  const used = new Set();
  ranked.forEach((photo) => {
    if (unique.length < 10 && !used.has(photo.id)) {
      used.add(photo.id);
      unique.push(photo);
    }
  });
  const scenes = unique.map((photo, index) => {
    const roomType = photo.roomType;
    return {
      photoId: photo.id,
      order: index + 1,
      roomType,
      visibleFeatures: fallbackVisibleFeatures(photo, roomType),
      qualityScore: photo.qualityScore,
      duration: durationFor(roomType, selectedStyle, index),
      cameraMotion: motionFor(roomType, selectedStyle, index),
      transition: transitionFor(roomType, selectedStyle, index),
      overlay: overlayFor(roomType, listingDetails, index)
    };
  });
  return normalizeEditPlan({
    source: "deterministic-fallback",
    heroPhotoId: scenes[0]?.photoId || photos[0]?.id,
    exportFormat,
    selectedStyle,
    musicMood: musicMoodFor(selectedStyle),
    introCard: {
      headline: listingDetails.address || "Featured listing",
      subline: [listingDetails.price, listingDetails.beds ? `${listingDetails.beds} BD` : "", listingDetails.baths ? `${listingDetails.baths} BA` : "", listingDetails.squareFeet ? `${listingDetails.squareFeet} SQ FT` : ""].filter(Boolean).join(" · ")
    },
    outroCard: {
      headline: listingDetails.agentName || "Schedule a private tour",
      subline: listingDetails.brokerage || listingDetails.cta || "Contact the listing agent"
    },
    scenes
  }, photos, { listingDetails, selectedStyle, exportFormat });
}

function validateEditPlan(plan, photos) {
  if (!plan || typeof plan !== "object") return { valid: false, error: "Edit plan is not an object." };
  const photoIds = new Set(photos.map((photo) => photo.id));
  if (!photoIds.has(plan.heroPhotoId)) return { valid: false, error: "Edit plan heroPhotoId does not match uploaded photos." };
  if (!Array.isArray(plan.scenes) || plan.scenes.length < 3) return { valid: false, error: "Edit plan must include at least 3 scenes." };
  const seen = new Set();
  for (const scene of plan.scenes) {
    if (!photoIds.has(scene.photoId)) return { valid: false, error: "Edit plan includes a photoId that was not uploaded." };
    if (seen.has(scene.photoId)) return { valid: false, error: "Edit plan repeats a photoId." };
    seen.add(scene.photoId);
    if (!ROOM_TYPES.includes(scene.roomType)) return { valid: false, error: "Edit plan includes an unsupported roomType." };
    if (!CAMERA_MOTIONS.includes(scene.cameraMotion)) return { valid: false, error: "Edit plan includes an unsupported cameraMotion." };
    if (!TRANSITIONS.includes(scene.transition)) return { valid: false, error: "Edit plan includes an unsupported transition." };
  }
  return { valid: true, error: "" };
}

function normalizeEditPlan(plan, photos, context) {
  const photoIds = new Set(photos.map((photo) => photo.id));
  const scenes = [...(plan.scenes || [])]
    .filter((scene) => photoIds.has(scene.photoId))
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
    .slice(0, 12)
    .map((scene, index) => ({
      photoId: scene.photoId,
      order: index + 1,
      roomType: ROOM_TYPES.includes(scene.roomType) ? scene.roomType : inferRoomType(photos.find((photo) => photo.id === scene.photoId), index),
      visibleFeatures: cleanStringArray(scene.visibleFeatures).slice(0, 5),
      qualityScore: clamp(Number(scene.qualityScore || 70), 0, 100),
      duration: clamp(Number(scene.duration || 2.4), 1.2, 5),
      cameraMotion: CAMERA_MOTIONS.includes(scene.cameraMotion) ? scene.cameraMotion : "parallax_zoom",
      transition: TRANSITIONS.includes(scene.transition) ? scene.transition : "crossfade",
      overlay: {
        headline: cleanText(scene.overlay?.headline || overlayFor(scene.roomType, context.listingDetails, index).headline, 70),
        subline: cleanText(scene.overlay?.subline || overlayFor(scene.roomType, context.listingDetails, index).subline, 90)
      }
    }));
  return {
    id: `motion-director-${Date.now()}`,
    source: plan.source || context.source || "openai-motion-director",
    heroPhotoId: photoIds.has(plan.heroPhotoId) ? plan.heroPhotoId : scenes[0]?.photoId,
    exportFormat: context.exportFormat || plan.exportFormat || "vertical",
    selectedStyle: context.selectedStyle || plan.selectedStyle || "Cinematic Luxury",
    musicMood: cleanText(plan.musicMood || musicMoodFor(context.selectedStyle), 80),
    introCard: {
      headline: cleanText(plan.introCard?.headline || context.listingDetails.address || "Featured listing", 80),
      subline: cleanText(plan.introCard?.subline || "", 100)
    },
    outroCard: {
      headline: cleanText(plan.outroCard?.headline || context.listingDetails.agentName || "Schedule a private tour", 80),
      subline: cleanText(plan.outroCard?.subline || context.listingDetails.brokerage || "", 100)
    },
    scenes
  };
}

function normalizeInputPhotos(photos) {
  return photos
    .map((photo, index) => {
      const url = String(photo.durableUrl || photo.durable_url || photo.publicUrl || photo.public_url || photo.imageUrl || photo.url || "");
      return {
        id: String(photo.id || photo.photoId || `photo-${index + 1}`),
        url,
        fileName: String(photo.fileName || photo.filename || `photo-${index + 1}.jpg`),
        width: Number(photo.width || 0),
        height: Number(photo.height || 0),
        category: String(photo.category || "")
      };
    })
    .filter((photo) => photo.id && photo.url && !isLocalOnlyUrl(photo.url));
}

function invalidInputPhotos(photos) {
  return photos
    .map((photo, index) => {
      const url = String(photo.durableUrl || photo.durable_url || photo.publicUrl || photo.public_url || photo.imageUrl || photo.url || "");
      return {
        id: String(photo.id || photo.photoId || `photo-${index + 1}`),
        url
      };
    })
    .filter((photo) => !photo.url || isLocalOnlyUrl(photo.url));
}

async function validateRemotePhotos(photos) {
  const invalidPhotos = [];
  for (const photo of photos) {
    const result = await validateRemotePhoto(photo);
    if (!result.valid) invalidPhotos.push({ id: photo.id, urlHost: safeUrlHost(photo.url), reason: result.reason, status: result.status || 0 });
  }
  if (invalidPhotos.length) {
    return {
      valid: false,
      reason: `${invalidPhotos.length} uploaded photo URL${invalidPhotos.length === 1 ? " is" : "s are"} not publicly reachable by the render/AI worker.`,
      invalidPhotos
    };
  }
  return { valid: true, reason: "", invalidPhotos: [] };
}

async function validateRemotePhoto(photo) {
  if (!photo.url || isLocalOnlyUrl(photo.url)) return { valid: false, reason: "local_or_temporary_url" };
  if (!/^https:\/\//i.test(photo.url)) return { valid: false, reason: "url_must_be_https" };
  try {
    const head = await fetchWithTimeout(photo.url, { method: "HEAD" }, 6000);
    if (head.ok) return validateImageContentType(head.headers.get("content-type"), photo.url);
    if (![403, 405].includes(head.status)) return { valid: false, reason: `http_${head.status}`, status: head.status };
  } catch (error) {
    logMotionDirector("warn", "photo HEAD validation failed; trying range GET", {
      photoId: photo.id,
      urlHost: safeUrlHost(photo.url),
      reason: error.message || error.name || "HEAD failed"
    });
  }
  try {
    const get = await fetchWithTimeout(photo.url, { method: "GET", headers: { Range: "bytes=0-0" } }, 7000);
    if (!get.ok && get.status !== 206) return { valid: false, reason: `http_${get.status}`, status: get.status };
    return validateImageContentType(get.headers.get("content-type"), photo.url);
  } catch (error) {
    return { valid: false, reason: error.name === "AbortError" ? "url_validation_timeout" : (error.message || "url_validation_failed") };
  }
}

function validateImageContentType(contentType, url) {
  const type = String(contentType || "").toLowerCase();
  if (!type) return { valid: true };
  if (type.startsWith("image/")) return { valid: true };
  if (/\.(jpe?g|png|webp|gif)(\?|#|$)/i.test(url)) return { valid: true };
  return { valid: false, reason: `unsupported_content_type:${type}` };
}

function normalizeListingDetails(details) {
  return {
    address: cleanText(details.address || details.propertyAddress || "", 120),
    price: cleanText(details.price || "", 40),
    beds: cleanText(details.beds || "", 20),
    baths: cleanText(details.baths || "", 20),
    squareFeet: cleanText(details.squareFeet || details.sqft || "", 30),
    city: cleanText(details.city || "", 60),
    neighborhood: cleanText(details.neighborhood || "", 60),
    agentName: cleanText(details.agentName || "", 80),
    brokerage: cleanText(details.brokerage || "", 80),
    cta: cleanText(details.cta || "", 80)
  };
}

function inferRoomType(photo = {}, index = 0) {
  const haystack = `${photo.fileName || ""} ${photo.category || ""}`.toLowerCase();
  if (/exterior|front|facade|house|home|curb/.test(haystack) || index === 0) return "exterior";
  if (/kitchen|island|cabinet|counter/.test(haystack)) return "kitchen";
  if (/living|family|great|room/.test(haystack)) return "living";
  if (/bed|primary|master/.test(haystack)) return "bedroom";
  if (/bath|shower|tub|vanity/.test(haystack)) return "bathroom";
  if (/yard|backyard|pool|patio|outdoor/.test(haystack)) return "outdoor";
  if (/gym|club|amenity|garage|view/.test(haystack)) return "amenity";
  return "detail";
}

function roomRank(roomType) {
  return { exterior: 0, kitchen: 1, living: 2, bedroom: 3, bathroom: 4, outdoor: 5, amenity: 6, detail: 7 }[roomType] ?? 99;
}

function qualityScore(photo, index) {
  const pixels = Number(photo.width || 0) * Number(photo.height || 0);
  const resolution = pixels ? Math.min(18, Math.round(pixels / 180000)) : 8;
  return clamp(92 - index * 3 + resolution - roomRank(inferRoomType(photo, index)), 45, 98);
}

function durationFor(roomType, style, index) {
  const fast = /social|modern/i.test(style || "");
  if (index === 0) return fast ? 2.1 : 3.0;
  if (roomType === "kitchen" || roomType === "living") return fast ? 1.8 : 2.7;
  if (roomType === "detail" || roomType === "bathroom") return fast ? 1.4 : 2.0;
  return fast ? 1.65 : 2.35;
}

function motionFor(roomType, style, index) {
  if (index === 0) return "parallax_zoom";
  if (roomType === "kitchen" || roomType === "living") return "lateral_pan";
  if (roomType === "bathroom") return "vertical_reveal";
  if (roomType === "detail") return "detail_sweep";
  if (/mls/i.test(style || "")) return "push_in";
  if (roomType === "outdoor" || roomType === "amenity") return "pull_out";
  return "push_in";
}

function transitionFor(roomType, style, index) {
  if (index === 0) return "crossfade";
  if (/social|modern/i.test(style || "")) return roomType === "kitchen" ? "whip_pan" : "match_cut";
  if (/luxury/i.test(style || "")) return index % 3 === 0 ? "light_leak" : "blur_wipe";
  return "crossfade";
}

function overlayFor(roomType, details, index) {
  if (index === 0) return { headline: details.address || "Featured listing", subline: [details.price, details.city].filter(Boolean).join(" · ") };
  const labels = {
    exterior: "Curb appeal",
    kitchen: "Kitchen",
    living: "Living space",
    bedroom: "Bedroom",
    bathroom: "Bath",
    outdoor: "Outdoor living",
    amenity: "Amenity",
    detail: "Design detail"
  };
  return {
    headline: labels[roomType] || "Property detail",
    subline: [details.beds ? `${details.beds} bed` : "", details.baths ? `${details.baths} bath` : "", details.squareFeet ? `${details.squareFeet} sq ft` : ""].filter(Boolean).join(" · ")
  };
}

function fallbackVisibleFeatures(photo, roomType) {
  const name = String(photo.fileName || "").replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
  return [name || roomType, roomType].filter(Boolean).slice(0, 3);
}

function musicMoodFor(style) {
  if (/social|modern/i.test(style || "")) return "upbeat social";
  if (/mls/i.test(style || "")) return "subtle ambient";
  if (/investor/i.test(style || "")) return "confident minimal";
  return "slow cinematic luxury";
}

function cleanStringArray(items) {
  return Array.isArray(items) ? items.map((item) => cleanText(item, 60)).filter(Boolean) : [];
}

function cleanText(value, maxLength = 120) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

function parseOpenAIJson(payload) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) return parseBody(payload.output_text);
  const output = Array.isArray(payload.output) ? payload.output : [];
  for (const item of output) {
    const content = Array.isArray(item.content) ? item.content : [];
    for (const part of content) {
      if (part.type === "output_text" && part.text) return parseBody(part.text);
      if (part.type === "text" && part.text) return parseBody(part.text);
    }
  }
  return {};
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

function setCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function extractOpenAIError(openaiResponse, payload) {
  const error = payload?.error || {};
  const status = openaiResponse.status;
  const type = String(error.type || "");
  const code = String(error.code || "");
  const message = String(error.message || `OpenAI returned ${status}.`);
  const requestId = openaiResponse.headers?.get?.("x-request-id") || payload.request_id || error.request_id || "";
  return {
    category: categorizeOpenAIError({ status, type, code, message }),
    status,
    type,
    code,
    message,
    requestId,
    model: motionModel()
  };
}

function categorizeOpenAIError({ status, type, code, message }) {
  const haystack = `${type} ${code} ${message}`.toLowerCase();
  if (status === 404 || haystack.includes("model") && (haystack.includes("not found") || haystack.includes("does not exist") || haystack.includes("invalid"))) return "invalid_model";
  if (status === 429 || haystack.includes("rate limit")) return "rate_limit";
  if (status === 402 || haystack.includes("billing") || haystack.includes("quota") || haystack.includes("insufficient_quota")) return "billing_or_quota";
  if (haystack.includes("image") && (haystack.includes("url") || haystack.includes("download") || haystack.includes("fetch") || haystack.includes("access"))) return "inaccessible_image_url";
  if (haystack.includes("schema") || haystack.includes("json_schema") || haystack.includes("structured")) return "schema_validation";
  if (status >= 500) return "openai_server_error";
  return "openai_request_failed";
}

function userFacingOpenAIReason(error) {
  const requestText = error.requestId ? ` Request ID: ${error.requestId}.` : "";
  const messages = {
    invalid_model: `Motion Director unavailable: invalid OpenAI model "${error.model}". Set OPENAI_MOTION_MODEL to a vision-capable model such as ${DEFAULT_MODEL}.${requestText}`,
    inaccessible_image_url: `Motion Director unavailable: OpenAI could not access one or more uploaded image URLs. Use public or long-lived signed Supabase URLs.${requestText}`,
    schema_validation: `Motion Director unavailable: OpenAI rejected or could not satisfy the edit-plan JSON schema.${requestText}`,
    rate_limit: `Motion Director unavailable: OpenAI rate limit reached. Try again shortly.${requestText}`,
    billing_or_quota: `Motion Director unavailable: OpenAI billing or quota issue. Check the project billing settings.${requestText}`,
    timeout: `Motion Director unavailable: OpenAI timed out.${requestText}`,
    openai_server_error: `Motion Director unavailable: OpenAI server error.${requestText}`
  };
  return messages[error.category] || `Motion Director unavailable: ${error.message}${requestText}`;
}

function safeUrlHost(url) {
  try {
    return new URL(url).host;
  } catch {
    return "";
  }
}

function logMotionDirector(level, message, details = {}) {
  const safeDetails = {
    ...details,
    at: new Date().toISOString()
  };
  const logger = level === "error" ? console.error : level === "warn" ? console.warn : console.info;
  logger(`[EstateMotion Motion Director] ${message}`, safeDetails);
}

function isLocalOnlyUrl(url = "") {
  const value = String(url || "").toLowerCase();
  return value.startsWith("blob:") || value.startsWith("data:") || value.includes("localhost") || value.includes("127.0.0.1");
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
