(function () {
  const root = window.EstateMotionReel = window.EstateMotionReel || {};

  function generateHook(listingDetails = {}, templateStyle = "luxury") {
    const city = listingDetails.city || listingDetails.neighborhood || "your market";
    if (templateStyle === "openHouse") return `Open House in ${city}`;
    if (templateStyle === "viral") return `Would you tour this ${city} home?`;
    if (templateStyle === "investor") return `Investor angle in ${city}`;
    return `Just Listed in ${city}`;
  }

  function generateCTA(listingDetails = {}) {
    return listingDetails.cta || "Schedule your private tour";
  }

  function generateSceneCaptions(sequence, listingDetails = {}) {
    const facts = [listingDetails.beds ? `${listingDetails.beds} Bed` : "", listingDetails.baths ? `${listingDetails.baths} Bath` : "", listingDetails.squareFeet ? `${listingDetails.squareFeet} Sq Ft` : ""].filter(Boolean).join(" | ");
    const captions = {
      "exterior hero": listingDetails.address || generateHook(listingDetails),
      kitchen: "Kitchen designed for daily living",
      "living room": "Bright, open living spaces",
      bedroom: "Comfortable bedroom retreat",
      bathroom: "Clean bathroom detail",
      "backyard/outdoor": "Outdoor space for Arizona living",
      amenity: "Neighborhood and lifestyle context",
      "detail/other": facts || "A closer look at the details"
    };
    return (sequence.scenes || []).map((scene) => ({
      sceneId: scene.id,
      caption: captions[scene.category] || "Featured listing moment"
    }));
  }

  root.copyGenerator = {
    generateHook,
    generateCTA,
    generateSceneCaptions
  };
})();
