import { TemplateStyle } from "./types";

export const templates: TemplateStyle[] = [
  {
    id: "modern-luxury",
    name: "Modern Luxury",
    description: "Slow cinematic movement, crisp titles, black and ivory cards.",
    fontStyle: "Elegant Sans",
    textPlacement: "bottom",
    motionSpeed: "slow",
    transitionStyle: "soft fade",
    introLayout: "Full-bleed hero with thin gold rule",
    outroLayout: "Portrait left, logo right, centered CTA",
    ctaWording: "Schedule your private showing",
    accentColor: "#C7A76C"
  },
  {
    id: "desert-luxury",
    name: "Scottsdale/Phoenix Desert Luxury",
    description: "Warm neutral accents, neighborhood language, premium resort pacing.",
    fontStyle: "Editorial Sans",
    textPlacement: "split",
    motionSpeed: "medium",
    transitionStyle: "gold wipe",
    introLayout: "Curb appeal opener with city badge",
    outroLayout: "Agent end card with desert-toned CTA",
    ctaWording: "Tour this Arizona listing",
    accentColor: "#B88746"
  },
  {
    id: "first-time-buyer",
    name: "First-Time Buyer Friendly",
    description: "Clear value props, approachable pacing, feature-first overlays.",
    fontStyle: "Friendly Sans",
    textPlacement: "top",
    motionSpeed: "medium",
    transitionStyle: "clean slide",
    introLayout: "Price-led hook with three quick reasons",
    outroLayout: "Friendly agent card with next-step CTA",
    ctaWording: "Want the details?",
    accentColor: "#2D7D78"
  },
  {
    id: "open-house",
    name: "Open House Promo",
    description: "Event-forward story format with date-ready CTA blocks.",
    fontStyle: "Bold Sans",
    textPlacement: "center",
    motionSpeed: "fast",
    transitionStyle: "whip pan",
    introLayout: "Open house announcement with map-style label",
    outroLayout: "Large CTA, contact, brokerage compliance",
    ctaWording: "Visit the open house",
    accentColor: "#111111"
  },
  {
    id: "just-listed-fast-cut",
    name: "Just Listed Fast Cut",
    description: "Punchy social-native cuts for Reels, TikTok, Shorts, and Stories.",
    fontStyle: "Condensed Sans",
    textPlacement: "bottom",
    motionSpeed: "fast",
    transitionStyle: "cut rhythm",
    introLayout: "Three-shot burst before title card",
    outroLayout: "Fast end card with headshot and handle",
    ctaWording: "DM for a showing",
    accentColor: "#E3BB73"
  }
];
