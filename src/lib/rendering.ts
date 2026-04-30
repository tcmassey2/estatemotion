import { BrandKit, ContentPackItem, CopyPack, ListingProject, RenderJob, TemplateStyle } from "../data/types";
import { sortPhotosForReel } from "./photoSorting";

export function createContentPack(project: ListingProject, template: TemplateStyle, copy: CopyPack): ContentPackItem[] {
  return [
    {
      id: "full-property-reel",
      title: "Full Property Reel",
      format: "9:16",
      durationSeconds: 28,
      hook: copy.hook,
      sequenceCategories: ["Exterior hero", "Entry transition", "Kitchen", "Living room", "Primary bedroom", "Backyard"],
      caption: copy.instagramCaption
    },
    {
      id: "kitchen-highlight",
      title: "Kitchen Highlight Reel",
      format: "9:16",
      durationSeconds: 12,
      hook: "The kitchen buyers will replay",
      sequenceCategories: ["Kitchen", "Detail shots", "Living room"],
      caption: copy.highlights[0]
    },
    {
      id: "curb-appeal",
      title: "Exterior Curb Appeal Reel",
      format: "1:1",
      durationSeconds: 10,
      hook: `${project.city} curb appeal in one glance`,
      sequenceCategories: ["Exterior hero", "Backyard"],
      caption: copy.highlights[1]
    },
    {
      id: "open-house-story",
      title: "Open House Story",
      format: "9:16",
      durationSeconds: 15,
      hook: template.id === "open-house" ? "Open house this week" : "Tour this listing",
      sequenceCategories: ["Exterior hero", "Entry transition", "Kitchen", "Living room"],
      caption: template.ctaWording
    }
  ];
}

export function createRenderJobs(project: ListingProject, template: TemplateStyle, brandKit: BrandKit, pack: ContentPackItem[]): RenderJob[] {
  const sorted = sortPhotosForReel(project.photos);
  return pack.flatMap((item) => {
    const formats = item.id === "full-property-reel" ? (["9:16", "1:1", "16:9"] as const) : [item.format];
    return formats.map((format) => ({
      id: `${item.id}-${format}`,
      outputName: `${project.title}-${item.title}-${format}.mp4`.replace(/\s+/g, "-").toLowerCase(),
      format,
      status: "queued" as const,
      estimatedSeconds: Math.max(12, item.durationSeconds * 2),
      pipeline: [
        `Select ${sorted.length} ordered listing photos`,
        `Apply ${template.motionSpeed} Ken Burns motion`,
        `Add ${template.transitionStyle} transitions`,
        `Place text ${template.textPlacement} with ${template.fontStyle}`,
        `Render brand end card for ${brandKit.name}`,
        project.authenticityMode ? "Keep Authenticity Mode enabled: no fake scene generation" : "Allow enhanced motion placeholder",
        brandKit.complianceEnabled ? "Append brokerage compliance disclaimer" : "Skip compliance footer",
        `Export ${format} MP4 plus thumbnail, caption, and hashtags`
      ]
    }));
  });
}
