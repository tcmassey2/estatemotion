(function () {
  const root = window.EstateMotionReel = window.EstateMotionReel || {};
  const maxImageBytes = 25 * 1024 * 1024;
  const supportedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  function validateImageFiles(files) {
    const selected = Array.from(files || []);
    const imageFiles = [];
    const rejectedFiles = [];
    selected.forEach((file) => {
      const type = String(file.type || "").toLowerCase();
      if (!type.startsWith("image/")) {
        rejectedFiles.push({ file, reason: "Unsupported file type. Upload JPG, PNG, or WebP listing photos." });
        return;
      }
      if (!supportedImageTypes.includes(type)) {
        rejectedFiles.push({ file, reason: `${file.name || "This image"} is ${type || "an unknown image type"}. Use JPG, PNG, or WebP for rendering.` });
        return;
      }
      if (!file.size) {
        rejectedFiles.push({ file, reason: `${file.name || "This image"} appears to be empty.` });
        return;
      }
      if (file.size > maxImageBytes) {
        rejectedFiles.push({ file, reason: `${file.name || "This image"} is larger than 25MB.` });
        return;
      }
      imageFiles.push(file);
    });
    return {
      imageFiles,
      rejectedFiles
    };
  }

  async function readImageDimensions(url) {
    if (!url) return { width: 0, height: 0, aspectRatio: 0 };
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve({
        width: image.naturalWidth || 0,
        height: image.naturalHeight || 0,
        aspectRatio: image.naturalWidth && image.naturalHeight ? Number((image.naturalWidth / image.naturalHeight).toFixed(3)) : 0
      });
      image.onerror = () => resolve({ width: 0, height: 0, aspectRatio: 0 });
      image.src = url;
    });
  }

  async function normalizeUploadedPhoto({ file, asset, id, uploadOrder }) {
    const url = asset.previewUrl || asset.durableUrl || asset.publicUrl || asset.url || "";
    const dimensions = await readImageDimensions(url);
    return {
      id,
      uri: url,
      objectUrl: asset.objectUrl || "",
      publicUrl: asset.publicUrl || "",
      public_url: asset.publicUrl || "",
      durableUrl: asset.durableUrl || asset.publicUrl || "",
      durable_url: asset.durableUrl || asset.publicUrl || "",
      durableUrlExpiresAt: asset.durableUrlExpiresAt || "",
      bucket: asset.bucket || "",
      storagePath: asset.path || "",
      fileName: file.name,
      size: file.size,
      mimeType: file.type,
      uploadOrder,
      width: dimensions.width,
      height: dimensions.height,
      aspectRatio: dimensions.aspectRatio
    };
  }

  root.photoIngestion = {
    maxImageBytes,
    supportedImageTypes,
    validateImageFiles,
    normalizeUploadedPhoto,
    readImageDimensions
  };
})();
