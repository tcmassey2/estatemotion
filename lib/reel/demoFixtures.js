(function () {
  const root = window.EstateMotionReel = window.EstateMotionReel || {};

  root.demoFixtures = {
    sampleListingImageMetadata: [
      {
        id: "fixture-exterior-hero",
        fileName: "phoenix-front-exterior-hero.jpg",
        mimeType: "image/jpeg",
        size: 1840000,
        width: 1800,
        height: 1200,
        expectedCategory: "exterior hero",
        durableUrlRequiredForLiveRender: true
      },
      {
        id: "fixture-kitchen",
        fileName: "phoenix-kitchen-island.webp",
        mimeType: "image/webp",
        size: 1420000,
        width: 1600,
        height: 1067,
        expectedCategory: "kitchen",
        durableUrlRequiredForLiveRender: true
      },
      {
        id: "fixture-living",
        fileName: "phoenix-living-room.png",
        mimeType: "image/png",
        size: 2300000,
        width: 1600,
        height: 1200,
        expectedCategory: "living room",
        durableUrlRequiredForLiveRender: true
      },
      {
        id: "fixture-unsupported",
        fileName: "agent-upload-bathroom.heic",
        mimeType: "image/heic",
        size: 1200000,
        expectedRejectedReason: "Unsupported image format"
      }
    ]
  };
})();
