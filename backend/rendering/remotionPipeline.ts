import { RenderInput } from "./renderTypes";

export function createRemotionComposition(input: RenderInput) {
  const dimensions = input.format === "9:16" ? { width: 1080, height: 1920 } : input.format === "1:1" ? { width: 1080, height: 1080 } : { width: 1920, height: 1080 };
  return {
    id: `project-${input.projectId}-${input.format}`,
    fps: 30,
    durationInFrames: Math.max(300, input.photos.length * 90 + 120),
    width: dimensions.width,
    height: dimensions.height,
    steps: [
      "load listing photos from cloud storage",
      "animate each image with Ken Burns pan/zoom",
      "crossfade or template transition between scenes",
      "draw hook, price, beds/baths/sqft, highlights",
      "append personal brand end card",
      "render MP4, thumbnail PNG, caption TXT, hashtags TXT"
    ]
  };
}
