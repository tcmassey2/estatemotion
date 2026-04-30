import { CopyPack, ListingProject, TemplateStyle } from "../data/types";

const localTone: Record<string, string> = {
  Phoenix: "central Phoenix convenience and everyday desert living",
  Scottsdale: "Scottsdale polish, resort energy, and indoor-outdoor appeal",
  Arcadia: "Arcadia charm, mature streets, and lifestyle-driven living",
  "Paradise Valley": "Paradise Valley privacy, views, and refined desert luxury",
  Tempe: "Tempe access, energy, and lock-and-leave convenience",
  Chandler: "Chandler comfort, schools, and easy East Valley access",
  Gilbert: "Gilbert neighborhood warmth and move-in-ready appeal",
  Mesa: "Mesa value, space, and desert views"
};

export function generateCopyPack(project: ListingProject, template: TemplateStyle): CopyPack {
  const localPhrase = project.localAgentMode ? localTone[project.city] ?? `${project.city} lifestyle appeal` : "a location buyers will remember";
  const hook = project.hookText || `${project.listingType}: ${project.beds} bed ${project.city} home with standout style`;
  const highlights = [
    `${project.beds} beds, ${project.baths} baths, and ${project.squareFeet} sq ft`,
    `${project.neighborhood} location with ${localPhrase}`,
    `${template.ctaWording} with clean, authentic listing-photo motion`
  ];

  return {
    hook,
    description: `${project.address} pairs ${localPhrase} with polished interiors, strong curb appeal, and a short-form video story built for modern buyers.`,
    highlights,
    instagramCaption: `${hook}\n\n${project.caption}\n\n${project.cta}`,
    hashtags: [`#${project.city}RealEstate`, "#ArizonaHomes", "#ListingReel", "#RealEstateMarketing", "#EstateMotion"],
    voiceoverScript: `${hook}. Here are three things buyers will notice: ${highlights.join(". ")}. ${project.cta}.`
  };
}

export async function requestOpenAICopy(project: ListingProject, template: TemplateStyle): Promise<CopyPack> {
  // Production TODO: call a secure backend endpoint that holds OPENAI_API_KEY.
  // The MVP keeps deterministic fallback copy so the app works without paid API setup.
  return generateCopyPack(project, template);
}
