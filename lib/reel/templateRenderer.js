(function () {
  const root = window.EstateMotionReel = window.EstateMotionReel || {};

  function buildRenderScenes(sequence, captions, template) {
    const captionByScene = new Map((captions || []).map((item) => [item.sceneId, item.caption]));
    return (sequence.scenes || []).map((scene, index) => ({
      order: index + 1,
      photoId: scene.photo.id,
      fileName: scene.photo.fileName,
      imageUrl: scene.photo.publicUrl || scene.photo.public_url || scene.photo.uri,
      publicUrl: scene.photo.publicUrl || scene.photo.public_url || "",
      sceneType: scene.category,
      duration: scene.duration || template.sceneDuration || 2,
      motionStyle: template.motionStyle || "Depth zoom",
      transition: template.transitionStyle || "soft dissolve",
      overlayText: captionByScene.get(scene.id) || "",
      captionPlacement: template.captionPlacement || "bottom",
      textStyle: template.textStyle || "premium"
    }));
  }

  root.templateRenderer = {
    buildRenderScenes
  };
})();
