(function () {
  const root = window.EstateMotionReel = window.EstateMotionReel || {};

  function verticalReelExport() {
    return {
      format: "mp4",
      codec: "h264",
      width: 1080,
      height: 1920,
      aspectRatio: "9:16",
      platforms: ["Instagram Reels", "TikTok", "YouTube Shorts"],
      mlsSafe: false
    };
  }

  function mlsSafeExport() {
    return {
      ...verticalReelExport(),
      mlsSafe: true,
      textGuidance: "Use factual listing details only; avoid exaggerated claims."
    };
  }

  root.exportOptimization = {
    verticalReelExport,
    mlsSafeExport
  };
})();
