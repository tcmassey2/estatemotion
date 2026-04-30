import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { demoBrandKit, demoProject } from "../../src/data/dummy";
import { templates } from "../../src/data/templates";

const compositionId = "EstateMotionReel";

async function main() {
  const entry = path.join(process.cwd(), "remotion", "index.ts");
  const serveUrl = await bundle({ entryPoint: entry });
  const inputProps = {
    project: demoProject,
    brandKit: demoBrandKit,
    template: templates[1],
    contentType: "full-property-reel"
  };
  const composition = await selectComposition({
    serveUrl,
    id: compositionId,
    inputProps
  });
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    inputProps,
    outputLocation: path.join(process.cwd(), "out", "estatemotion-full-property-reel.mp4")
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
