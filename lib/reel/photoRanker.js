(function () {
  const root = window.EstateMotionReel = window.EstateMotionReel || {};

  const categoryPriority = {
    "exterior hero": 100,
    kitchen: 92,
    "living room": 88,
    bedroom: 76,
    bathroom: 70,
    "backyard/outdoor": 82,
    amenity: 62,
    "detail/other": 42
  };

  function scorePhoto(photo) {
    const classification = photo.classification || { category: photo.pipelineCategory || "detail/other", confidence: photo.confidence || 50 };
    const dimensions = (Number(photo.width) || 0) * (Number(photo.height) || 0);
    const resolutionScore = Math.min(18, dimensions / 180000);
    const wideHeroBonus = classification.category === "exterior hero" && Number(photo.aspectRatio || 0) >= 1.25 ? 8 : 0;
    const orderPenalty = Math.min(10, Number(photo.uploadOrder ?? photo.order ?? 0) * 0.6);
    const duplicatePenalty = photo.duplicateKey && photo.duplicateSeen ? 25 : 0;
    return Math.round((categoryPriority[classification.category] || 40) + resolutionScore + wideHeroBonus + Number(classification.confidence || 0) * 0.18 - orderPenalty - duplicatePenalty);
  }

  function rankPhotos(photos) {
    const seen = new Set();
    return photos.map((photo) => {
      const duplicateKey = `${String(photo.fileName || "").toLowerCase()}::${photo.size || 0}`;
      const duplicateSeen = seen.has(duplicateKey);
      seen.add(duplicateKey);
      const ranked = { ...photo, duplicateKey, duplicateSeen };
      return { ...ranked, reelScore: scorePhoto(ranked) };
    }).sort((a, b) => b.reelScore - a.reelScore || (a.uploadOrder ?? a.order ?? 0) - (b.uploadOrder ?? b.order ?? 0));
  }

  root.photoRanker = {
    categoryPriority,
    scorePhoto,
    rankPhotos
  };
})();
