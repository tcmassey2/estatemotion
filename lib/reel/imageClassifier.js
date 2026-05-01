(function () {
  const root = window.EstateMotionReel = window.EstateMotionReel || {};
  const allowedCategories = [
    "exterior hero",
    "kitchen",
    "living room",
    "bedroom",
    "bathroom",
    "backyard/outdoor",
    "amenity",
    "detail/other"
  ];

  const rules = {
    "exterior hero": ["exterior", "front", "house", "home", "facade", "elevation", "curb", "street"],
    kitchen: ["kitchen", "island", "cabinet", "range", "pantry", "counter"],
    "living room": ["living", "family", "greatroom", "great-room", "lounge", "fireplace"],
    bedroom: ["bed", "bedroom", "primary", "master", "suite"],
    bathroom: ["bath", "bathroom", "shower", "tub", "vanity", "powder"],
    "backyard/outdoor": ["backyard", "pool", "patio", "yard", "outdoor", "spa", "terrace", "balcony"],
    amenity: ["gym", "clubhouse", "view", "garage", "amenity", "park", "community", "golf", "mountain"],
    "detail/other": ["detail", "fixture", "finish", "tile", "hardware", "lighting"]
  };

  const orderHints = ["exterior hero", "kitchen", "living room", "bedroom", "bathroom", "backyard/outdoor", "amenity", "detail/other"];
  const lowConfidenceThreshold = 62;

  function classifyPhoto(photo) {
    const fileName = String(photo.fileName || photo.name || "").toLowerCase().replaceAll("_", "-");
    const uploadOrder = Number(photo.uploadOrder ?? photo.order ?? 0);
    const scores = Object.entries(rules).map(([category, keywords]) => {
      const hits = keywords.filter((keyword) => fileName.includes(keyword));
      const keywordScore = hits.length * 0.28;
      const orderScore = category === orderHints[Math.min(uploadOrder, orderHints.length - 1)] ? 0.16 : 0;
      const heroBoost = uploadOrder === 0 && category === "exterior hero" ? 0.2 : 0;
      const fallback = category === "detail/other" ? 0.22 : 0.12;
      return {
        category,
        score: Math.min(0.98, fallback + keywordScore + orderScore + heroBoost),
        tags: hits
      };
    }).sort((a, b) => b.score - a.score);

    const winner = scores[0] || { category: "detail/other", score: 0.5, tags: [] };
    return {
      category: winner.category,
      confidence: Math.round(winner.score * 100),
      tags: winner.tags,
      visibleFeatures: winner.tags,
      description: fallbackDescription(winner.category),
      source: "fallback",
      suggestedCorrections: scores.slice(1, 3).map((item) => item.category)
    };
  }

  async function classifyPhotoWithVision(photo, options = {}) {
    // Vision provider plug-in point:
    // /api/classify-image currently uses OpenAI Vision server-side. A future
    // Google Vision or AWS Rekognition worker can return the same normalized
    // category/confidence/features shape and keep the reel planner unchanged.
    const fallback = classifyPhoto(photo);
    const endpoint = options.endpoint || "/api/classify-image";
    const threshold = Number(options.lowConfidenceThreshold || lowConfidenceThreshold);
    const imageUrl = photo.publicUrl || photo.public_url || photo.uri || photo.url || "";

    if (!endpoint || !imageUrl || imageUrl.startsWith("blob:")) {
      return { ...fallback, fallbackReason: imageUrl.startsWith("blob:") ? "Blob URLs are browser-only." : "No image URL available." };
    }

    try {
      const response = await fetchWithTimeout(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl,
          fileName: photo.fileName || photo.name || "",
          uploadOrder: photo.uploadOrder ?? photo.order ?? 0
        })
      }, Number(options.timeoutMs || 18000));

      if (!response.ok) {
        return { ...fallback, fallbackReason: `Vision endpoint returned ${response.status}.` };
      }

      const payload = await response.json();
      if (payload.status === "fallback" || payload.fallback) {
        return { ...fallback, fallbackReason: payload.reason || payload.error || "Vision classifier unavailable." };
      }

      const result = normalizeVisionResult(payload.result || payload, fallback);
      if (result.confidence < threshold) {
        return { ...fallback, fallbackReason: `Vision confidence was ${result.confidence}%.`, visionResult: result };
      }

      return result;
    } catch (error) {
      return { ...fallback, fallbackReason: error.message || "Vision classifier failed." };
    }
  }

  async function classifyPhotosWithVision(photos, options = {}) {
    const results = [];
    for (const [index, photo] of photos.entries()) {
      results.push(await classifyPhotoWithVision({ ...photo, uploadOrder: photo.uploadOrder ?? index }, options));
    }
    return results;
  }

  function normalizeVisionResult(result, fallback) {
    const category = allowedCategories.includes(result.category) ? result.category : fallback.category;
    const confidence = Math.max(0, Math.min(100, Math.round(Number(result.confidence || 0))));
    const visibleFeatures = Array.isArray(result.visibleFeatures) ? result.visibleFeatures.slice(0, 6).map(String) : [];
    const tags = Array.isArray(result.tags) ? result.tags.slice(0, 6).map(String) : visibleFeatures;
    return {
      category,
      confidence,
      tags,
      visibleFeatures,
      description: String(result.description || fallback.description || fallbackDescription(category)).slice(0, 180),
      source: "openai-vision",
      suggestedCorrections: allowedCategories.filter((item) => item !== category).slice(0, 2)
    };
  }

  function fallbackDescription(category) {
    const descriptions = {
      "exterior hero": "Likely exterior listing photo.",
      kitchen: "Likely kitchen or cooking area.",
      "living room": "Likely living or main gathering space.",
      bedroom: "Likely bedroom or suite.",
      bathroom: "Likely bathroom or vanity area.",
      "backyard/outdoor": "Likely outdoor living area.",
      amenity: "Likely amenity, view, garage, or neighborhood feature.",
      "detail/other": "Listing detail or uncategorized photo."
    };
    return descriptions[category] || descriptions["detail/other"];
  }

  async function fetchWithTimeout(url, options, timeoutMs) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function classifyPhotos(photos) {
    return photos.map((photo, index) => ({
      ...photo,
      uploadOrder: photo.uploadOrder ?? index,
      classification: classifyPhoto({ ...photo, uploadOrder: photo.uploadOrder ?? index })
    }));
  }

  root.imageClassifier = {
    allowedCategories,
    rules,
    classifyPhoto,
    classifyPhotos,
    classifyPhotoWithVision,
    classifyPhotosWithVision
  };
})();
