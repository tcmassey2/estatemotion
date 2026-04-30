import { demoBrandKit, demoProject } from "../../src/data/dummy";
import { createRemotionComposition } from "./remotionPipeline";
import { buildFfmpegCommand } from "./ffmpegRenderer";

async function main() {
  const input = {
    projectId: demoProject.id,
    outputName: "modern-desert-retreat-full-property-reel.mp4",
    format: "9:16" as const,
    photos: demoProject.photos,
    overlays: [{ atSecond: 0, text: demoProject.hookText, placement: "bottom" as const }],
    brandKit: demoBrandKit,
    compliance: {
      listingCourtesyOf: demoBrandKit.listingCourtesyOf,
      equalHousing: true,
      mlsDisclaimer: demoBrandKit.mlsDisclaimer
    }
  };
  console.log(JSON.stringify(createRemotionComposition(input), null, 2));
  console.log(await buildFfmpegCommand(input));
}

main();
