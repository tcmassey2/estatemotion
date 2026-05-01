(function () {
  const root = window.EstateMotionReel = window.EstateMotionReel || {};
  const tourOrder = ["exterior hero", "kitchen", "living room", "bedroom", "bathroom", "backyard/outdoor", "amenity", "detail/other"];

  function createReelSequence(photos, listingDetails = {}, templateStyle = "luxury") {
    const ranked = root.photoRanker ? root.photoRanker.rankPhotos(photos) : photos;
    const byCategory = tourOrder.flatMap((category) => ranked
      .filter((photo) => (photo.pipelineCategory || photo.classification?.category || "detail/other") === category)
      .slice(0, category === "detail/other" ? 2 : 3));
    const unique = [];
    const used = new Set();
    byCategory.forEach((photo) => {
      if (!used.has(photo.id)) {
        used.add(photo.id);
        unique.push(photo);
      }
    });
    ranked.forEach((photo) => {
      if (unique.length < 10 && !used.has(photo.id)) {
        used.add(photo.id);
        unique.push(photo);
      }
    });

    const scenes = unique.slice(0, 10).map((photo, index) => ({
      id: `scene-${index + 1}`,
      type: "photo",
      order: index + 1,
      photo,
      category: photo.pipelineCategory || photo.classification?.category || "detail/other",
      duration: templateDuration(templateStyle, index),
      role: index === 0 ? "exterior/title reveal" : "property tour"
    }));

    return {
      intro: { id: "intro", type: "intro", caption: listingDetails.address || "Featured listing", duration: 2.2 },
      scenes,
      outro: { id: "outro", type: "outro", caption: listingDetails.cta || "Schedule your private tour", duration: 3 },
      totalDuration: Number((scenes.reduce((sum, scene) => sum + scene.duration, 5.2)).toFixed(1))
    };
  }

  function templateDuration(templateStyle, index) {
    if (templateStyle === "viral") return index === 0 ? 1.6 : 1.25;
    if (templateStyle === "openHouse") return index === 0 ? 2 : 1.55;
    if (templateStyle === "mlsClean") return 2.2;
    if (templateStyle === "investor") return 1.85;
    return index === 0 ? 2.7 : 2.25;
  }

  root.sequencePlanner = {
    tourOrder,
    createReelSequence
  };
})();
