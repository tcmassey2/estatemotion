const storageKey = "estatemotion.local.mvp.v2";
const legacyStorageKey = "estatemotion.local.mvp.v1";

const featureFlags = readFeatureFlags();

const templates = [
  {
    id: "modern-luxury",
    name: "Modern Luxury",
    description: "Slow cinematic movement, editorial titles, black/ivory/champagne finish.",
    fontStyle: "Elegant Sans",
    textPlacement: "bottom",
    motionSpeed: "slow",
    transitionStyle: "soft fade",
    ctaWording: "Schedule your private showing",
    accentColor: "#C7A76C",
    visualCue: "Editorial black frame"
  },
  {
    id: "desert-luxury",
    name: "Scottsdale Desert Luxury",
    description: "Warm desert neutrals, resort pacing, and upscale local-market language.",
    fontStyle: "Editorial Sans",
    textPlacement: "split",
    motionSpeed: "medium",
    transitionStyle: "gold wipe",
    ctaWording: "Tour this Arizona listing",
    accentColor: "#B88746",
    visualCue: "Desert resort reveal"
  },
  {
    id: "viral-fast-cut",
    name: "Viral Fast Cut",
    description: "Punchy social-native rhythm, curiosity hooks, and fast scene changes.",
    fontStyle: "Bold Sans",
    textPlacement: "top",
    motionSpeed: "fast",
    transitionStyle: "snap cut",
    ctaWording: "DM for the full tour",
    accentColor: "#E3BB73",
    visualCue: "High-retention Reel"
  },
  {
    id: "open-house",
    name: "Open House Promo",
    description: "Event-forward story format with date-ready CTA blocks.",
    fontStyle: "Bold Sans",
    textPlacement: "center",
    motionSpeed: "fast",
    transitionStyle: "whip pan",
    ctaWording: "Visit the open house",
    accentColor: "#111111",
    visualCue: "Event invitation"
  },
  {
    id: "mls-clean",
    name: "MLS Clean",
    description: "Compliance-safe, minimal, and property-first for broad distribution.",
    fontStyle: "Clean Sans",
    textPlacement: "bottom",
    motionSpeed: "medium",
    transitionStyle: "clean dissolve",
    ctaWording: "Request listing details",
    accentColor: "#6C717A",
    visualCue: "MLS-safe clarity"
  },
  {
    id: "agent-brand-builder",
    name: "Agent Brand Builder",
    description: "Agent-forward storytelling with stronger end-card authority and CTA.",
    fontStyle: "Luxury Sans",
    textPlacement: "center",
    motionSpeed: "medium",
    transitionStyle: "brand reveal",
    ctaWording: "Follow for more local homes",
    accentColor: "#2D7D78",
    visualCue: "Personal brand lift"
  }
];

const demoPhotos = [
  {
    id: "demo-1",
    uri: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    fileName: "exterior-front.jpg",
    category: "Exterior",
    order: 1
  },
  {
    id: "demo-2",
    uri: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80",
    fileName: "living-room.jpg",
    category: "Living room",
    order: 2
  },
  {
    id: "demo-3",
    uri: "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1200&q=80",
    fileName: "kitchen.jpg",
    category: "Kitchen",
    order: 3
  },
  {
    id: "demo-4",
    uri: "https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=1200&q=80",
    fileName: "primary-bedroom.jpg",
    category: "Primary bedroom",
    order: 4
  }
];

const sampleProjects = [
  {
    id: "sample-scottsdale",
    title: "Modern Desert Retreat",
    location: "Scottsdale, AZ",
    type: "Just Listed",
    thumbnail: demoPhotos[0].uri
  },
  {
    id: "sample-arcadia",
    title: "Arcadia Family Remodel",
    location: "Phoenix, AZ",
    type: "Open House",
    thumbnail: demoPhotos[1].uri
  },
  {
    id: "sample-tempe",
    title: "Tempe Townhouse Launch",
    location: "Tempe, AZ",
    type: "Coming Soon",
    thumbnail: demoPhotos[2].uri
  }
];

const sceneTypes = [
  "Exterior hero",
  "Entry / front door",
  "Kitchen",
  "Living room",
  "Dining",
  "Primary bedroom",
  "Bathroom",
  "Backyard / pool",
  "Neighborhood / amenities",
  "Detail shots"
];

const featuredPropertyFlow = [
  "Exterior hero",
  "Entry / front door",
  "Interior reveal",
  "Kitchen",
  "Living room",
  "Dining",
  "Primary bedroom",
  "Bathroom",
  "Backyard / pool",
  "Neighborhood / amenities",
  "CTA close",
  "Detail shots"
];

const hookPresets = {
  "Just Listed": "Just listed in {city}: a home buyers will want to see fast",
  "Open House": "Open house this week: step inside this {city} listing",
  Luxury: "Inside a luxury {city} home with standout design",
  "Under $X": "Inside this {city} home under {price}",
  "Investment Opportunity": "Investment opportunity in {city} with strong buyer appeal",
  "Scottsdale Luxury": "Inside this Scottsdale luxury listing built for desert resort living",
  "Phoenix Starter Home": "Inside this Phoenix starter home buyers can actually picture themselves in",
  "Arcadia Family Home": "Arcadia family living with the spaces buyers replay"
};

const captionTonePresets = {
  Luxury: "Elevated, polished, and cinematic with a premium real estate voice.",
  Friendly: "Warm, approachable, and easy for everyday buyers to understand.",
  Viral: "Short, curiosity-led, and social-native with fast pattern interrupts.",
  Investor: "Numbers-aware, opportunity-focused, and direct.",
  "First-time buyer": "Clear, encouraging, and focused on value and livability.",
  "Local agent mode": "Neighborhood-specific, agent-led, and grounded in local market language."
};

const ctaPresets = ["DM for price", "Book a showing", "Schedule private tour", "Tour this home", "Ask for details", "Schedule showing"];

const sceneIntelligence = {
  "Exterior hero": {
    keywords: ["exterior", "front", "curb", "street", "hero", "facade", "elevation"],
    suggestedMotion: "Depth zoom",
    overlay: "Curb appeal opener"
  },
  "Entry / front door": {
    keywords: ["entry", "foyer", "door", "front-door", "hall", "arrival", "porch"],
    suggestedMotion: "Push-in",
    overlay: "Step inside"
  },
  Kitchen: {
    keywords: ["kitchen", "island", "pantry", "cabinet", "range", "counter"],
    suggestedMotion: "Slow pan",
    overlay: "Kitchen spotlight"
  },
  "Living room": {
    keywords: ["living", "great", "family", "lounge", "fireplace"],
    suggestedMotion: "Pull-out",
    overlay: "Main living reveal"
  },
  Dining: {
    keywords: ["dining", "breakfast", "nook", "table"],
    suggestedMotion: "Slow pan",
    overlay: "Dining moment"
  },
  "Primary bedroom": {
    keywords: ["primary", "master", "bedroom", "suite"],
    suggestedMotion: "Push-in",
    overlay: "Primary suite"
  },
  Bathroom: {
    keywords: ["bath", "vanity", "shower", "tub", "powder"],
    suggestedMotion: "Vertical social framing",
    overlay: "Bath detail"
  },
  "Backyard / pool": {
    keywords: ["yard", "pool", "patio", "garden", "terrace", "balcony", "outdoor", "spa"],
    suggestedMotion: "Orbit simulation",
    overlay: "Outdoor lifestyle"
  },
  "Neighborhood / amenities": {
    keywords: ["neighborhood", "amenity", "club", "park", "community", "view", "mountain", "golf"],
    suggestedMotion: "Slow pan",
    overlay: "Neighborhood context"
  },
  "Detail shots": {
    keywords: ["detail", "fixture", "finish", "tile", "hardware", "lighting"],
    suggestedMotion: "Depth zoom",
    overlay: "Design detail"
  }
};

const motionSystems = {
  Luxury: { defaultMotion: "Depth zoom", tempo: "slow cinematic", baseDuration: 2.4, transition: "soft dissolve", beatEvery: 2 },
  Viral: { defaultMotion: "Push-in", tempo: "punchy cuts", baseDuration: 1.25, transition: "snap cut", beatEvery: 1 },
  "Open House": { defaultMotion: "Pull-out", tempo: "energetic invite", baseDuration: 1.55, transition: "whip reveal", beatEvery: 1 },
  Investor: { defaultMotion: "Slow pan", tempo: "strategic proof", baseDuration: 1.9, transition: "clean cut", beatEvery: 2 },
  "First-time buyer": { defaultMotion: "Push-in", tempo: "approachable tour", baseDuration: 1.75, transition: "friendly slide", beatEvery: 2 }
};

const reelThemes = [
  {
    id: "luxury-modern",
    name: "Luxury Modern",
    accent: "#C7A76C",
    background: "#101113",
    description: "Black, white, gold, editorial spacing."
  },
  {
    id: "scottsdale-desert-luxury",
    name: "Scottsdale Desert Luxury",
    accent: "#B88746",
    background: "#2B2118",
    description: "Warm desert neutrals with resort energy."
  },
  {
    id: "open-house-fast-cut",
    name: "Open House Fast Cut",
    accent: "#111111",
    background: "#F8F6F1",
    description: "Bold event-forward cuts and urgent CTA."
  },
  {
    id: "first-time-buyer-friendly",
    name: "First-Time Buyer Friendly",
    accent: "#2D7D78",
    background: "#F7FAF9",
    description: "Clear, helpful, approachable overlays."
  },
  {
    id: "investor-cash-flow",
    name: "Investor / Cash Flow",
    accent: "#4C7A45",
    background: "#111711",
    description: "Direct, numbers-aware, opportunity-led."
  }
];

const textAnimationStyles = ["Fade", "Slide up", "Bold cut", "Luxury minimal"];
const musicMoods = ["Luxury", "Modern", "Energetic", "Corporate"];
const outroVariations = ["Headshot + CTA", "Brokerage logo only", "Social follow CTA"];
const thumbnailPresets = ["Just Listed", "Inside This Home", "Phoenix Property Tour"];
const reelVariationPresets = {
  Premium: {
    reelTheme: "luxury-modern",
    textAnimation: "Luxury minimal",
    musicMood: "Luxury",
    outroVariation: "Headshot + CTA",
    thumbnailPreset: "Inside This Home",
    captionTone: "Luxury"
  },
  "Social Viral": {
    reelTheme: "open-house-fast-cut",
    textAnimation: "Bold cut",
    musicMood: "Energetic",
    outroVariation: "Social follow CTA",
    thumbnailPreset: "Just Listed",
    captionTone: "Friendly"
  },
  Professional: {
    reelTheme: "scottsdale-desert-luxury",
    textAnimation: "Fade",
    musicMood: "Corporate",
    outroVariation: "Brokerage logo only",
    thumbnailPreset: "Phoenix Property Tour",
    captionTone: "Investor"
  }
};

const showcaseProjects = [
  {
    id: "showcase-phoenix-starter",
    title: "Phoenix Starter Home",
    location: "Phoenix, AZ",
    type: "Just Listed",
    price: "$485,000",
    themeLabel: "First-Time Buyer Friendly",
    thumbnail: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=1200&q=80",
    project: {
      title: "Phoenix Starter Home",
      address: "1842 E Palm Lane",
      price: "$485,000",
      beds: "3",
      baths: "2",
      squareFeet: "1,720",
      neighborhood: "Coronado",
      city: "Phoenix",
      listingType: "Just Listed",
      hookText: "Inside this Phoenix starter home under $500K",
      caption: "A bright central Phoenix home with practical updates, inviting living spaces, and a neighborhood buyers already love.",
      cta: "DM for price",
      hookPreset: "Under $X",
      captionTone: "First-time buyer",
      reelTheme: "first-time-buyer-friendly",
      textAnimation: "Slide up",
      musicMood: "Modern",
      outroVariation: "Headshot + CTA",
      thumbnailPreset: "Just Listed",
      reelVariations: [],
      brandingVisible: true,
      authenticityMode: true,
      localAgentMode: true,
      photos: [
        { id: "phx-1", uri: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=1200&q=80", fileName: "phoenix-exterior-hero.jpg", category: "Exterior hero", order: 1 },
        { id: "phx-2", uri: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80", fileName: "phoenix-entry-transition.jpg", category: "Entry transition", order: 2 },
        { id: "phx-3", uri: "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?auto=format&fit=crop&w=1200&q=80", fileName: "phoenix-kitchen.jpg", category: "Kitchen", order: 3 },
        { id: "phx-4", uri: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1200&q=80", fileName: "phoenix-living-room.jpg", category: "Living room", order: 4 },
        { id: "phx-5", uri: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80", fileName: "phoenix-primary-bedroom.jpg", category: "Primary bedroom", order: 5 },
        { id: "phx-6", uri: "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1200&q=80", fileName: "phoenix-bathroom.jpg", category: "Bathroom", order: 6 },
        { id: "phx-7", uri: "https://images.unsplash.com/photo-1597047084897-51e81819a499?auto=format&fit=crop&w=1200&q=80", fileName: "phoenix-backyard-patio.jpg", category: "Backyard", order: 7 }
      ]
    },
    selectedTemplateId: "agent-brand-builder",
    whyThisWorks: {
      Hook: "The price-led hook makes the home feel attainable and scroll-stopping for entry buyers.",
      "Scene pacing": "The reel opens with curb appeal, moves quickly into livable spaces, then closes on the backyard lifestyle beat.",
      CTA: "A simple DM CTA keeps the next step low-friction for buyers who are still early.",
      Branding: "The agent appears as a helpful guide, not a hard sell, which fits first-time buyer psychology."
    }
  },
  {
    id: "showcase-arcadia-family",
    title: "Arcadia Family Home",
    location: "Arcadia, Phoenix, AZ",
    type: "Open House",
    price: "$1,095,000",
    themeLabel: "Luxury Modern",
    thumbnail: "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1200&q=80",
    project: {
      title: "Arcadia Family Home",
      address: "4325 E Campbell Avenue",
      price: "$1,095,000",
      beds: "4",
      baths: "3",
      squareFeet: "2,860",
      neighborhood: "Arcadia",
      city: "Arcadia",
      listingType: "Open House",
      hookText: "Open house this week in Arcadia: family living with designer updates",
      caption: "A polished Arcadia home with generous gathering spaces, a standout kitchen, and the kind of backyard that sells the lifestyle instantly.",
      cta: "Tour this home",
      hookPreset: "Open House",
      captionTone: "Friendly",
      reelTheme: "luxury-modern",
      textAnimation: "Fade",
      musicMood: "Corporate",
      outroVariation: "Headshot + CTA",
      thumbnailPreset: "Phoenix Property Tour",
      reelVariations: [],
      brandingVisible: true,
      authenticityMode: true,
      localAgentMode: true,
      photos: [
        { id: "arc-1", uri: "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1200&q=80", fileName: "arcadia-exterior-hero.jpg", category: "Exterior hero", order: 1 },
        { id: "arc-2", uri: "https://images.unsplash.com/photo-1616137466211-f939a420be84?auto=format&fit=crop&w=1200&q=80", fileName: "arcadia-entry.jpg", category: "Entry transition", order: 2 },
        { id: "arc-3", uri: "https://images.unsplash.com/photo-1600489000022-c2086d79f9d4?auto=format&fit=crop&w=1200&q=80", fileName: "arcadia-kitchen-island.jpg", category: "Kitchen", order: 3 },
        { id: "arc-4", uri: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80", fileName: "arcadia-living-room.jpg", category: "Living room", order: 4 },
        { id: "arc-5", uri: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80", fileName: "arcadia-primary-suite.jpg", category: "Primary bedroom", order: 5 },
        { id: "arc-6", uri: "https://images.unsplash.com/photo-1600566752229-250ed79470f8?auto=format&fit=crop&w=1200&q=80", fileName: "arcadia-bathroom.jpg", category: "Bathroom", order: 6 },
        { id: "arc-7", uri: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80", fileName: "arcadia-backyard.jpg", category: "Backyard", order: 7 },
        { id: "arc-8", uri: "https://images.unsplash.com/photo-1600566753151-384129cf4e3e?auto=format&fit=crop&w=1200&q=80", fileName: "arcadia-detail-shot.jpg", category: "Detail shots", order: 8 }
      ]
    },
    selectedTemplateId: "open-house",
    whyThisWorks: {
      Hook: "The open-house hook gives agents an immediate reason to post and buyers a reason to act this week.",
      "Scene pacing": "The sequence alternates big family spaces with warm details so it feels premium without dragging.",
      CTA: "The tour CTA matches event intent and makes the reel useful for Stories, Reels, and follow-up texts.",
      Branding: "The end card reinforces the agent and brokerage while keeping the property as the hero."
    }
  },
  {
    id: "showcase-scottsdale-luxury",
    title: "Scottsdale Luxury Listing",
    location: "Scottsdale, AZ",
    type: "Coming Soon",
    price: "$2,850,000",
    themeLabel: "Scottsdale Desert Luxury",
    thumbnail: "https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1200&q=80",
    project: {
      title: "Scottsdale Luxury Listing",
      address: "9828 E Pinnacle Peak Road",
      price: "$2,850,000",
      beds: "5",
      baths: "5.5",
      squareFeet: "5,640",
      neighborhood: "Silverleaf",
      city: "Scottsdale",
      listingType: "Coming Soon",
      hookText: "Inside a Scottsdale luxury home built for desert resort living",
      caption: "A cinematic Scottsdale listing with warm architecture, resort-style outdoor living, and refined spaces designed for memorable showings.",
      cta: "Schedule showing",
      hookPreset: "Luxury",
      captionTone: "Luxury",
      reelTheme: "scottsdale-desert-luxury",
      textAnimation: "Luxury minimal",
      musicMood: "Luxury",
      outroVariation: "Brokerage logo only",
      thumbnailPreset: "Inside This Home",
      reelVariations: [],
      brandingVisible: true,
      authenticityMode: true,
      localAgentMode: true,
      photos: [
        { id: "sdl-1", uri: "https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1200&q=80", fileName: "scottsdale-exterior-hero.jpg", category: "Exterior hero", order: 1 },
        { id: "sdl-2", uri: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80", fileName: "scottsdale-entry-transition.jpg", category: "Entry transition", order: 2 },
        { id: "sdl-3", uri: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80", fileName: "scottsdale-kitchen.jpg", category: "Kitchen", order: 3 },
        { id: "sdl-4", uri: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=80", fileName: "scottsdale-living-room.jpg", category: "Living room", order: 4 },
        { id: "sdl-5", uri: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80", fileName: "scottsdale-primary-bedroom.jpg", category: "Primary bedroom", order: 5 },
        { id: "sdl-6", uri: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1200&q=80", fileName: "scottsdale-bathroom.jpg", category: "Bathroom", order: 6 },
        { id: "sdl-7", uri: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80", fileName: "scottsdale-backyard-pool.jpg", category: "Backyard", order: 7 },
        { id: "sdl-8", uri: "https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=1200&q=80", fileName: "scottsdale-detail-shot.jpg", category: "Detail shots", order: 8 }
      ]
    },
    selectedTemplateId: "desert-luxury",
    whyThisWorks: {
      Hook: "The luxury hook sells the feeling first, which is what high-end buyers and listing agents expect.",
      "Scene pacing": "Longer hero beats, warm transitions, and outdoor lifestyle scenes make the reel feel cinematic.",
      CTA: "The showing CTA protects exclusivity and feels appropriate for a premium listing.",
      Branding: "Brokerage-forward outro keeps the presentation polished for seller meetings and partner demos."
    }
  }
].map((showcase) => ({
  ...showcase,
  project: {
    ...showcase.project,
    reelVariations: Object.entries(reelVariationPresets).map(([name, settings]) => ({
      name,
      hook: `${name}: ${showcase.project.hookText}`,
      settings
    }))
  }
}));

const defaultState = {
  hasOnboarded: false,
  screen: "dashboard",
  authStatus: featureFlags.MOCK_SUPABASE ? "mock" : "checking",
  authEmail: "",
  selectedTemplateId: "desert-luxury",
  selectedShowcaseId: "showcase-scottsdale-luxury",
  selectedScene: 0,
  exportResult: null,
  renderQueue: [],
  loading: "",
  error: "",
  toasts: [],
  leads: [],
  analyticsEvents: [],
  earlyAccessForm: {
    name: "",
    email: "",
    brokerage: "",
    city: "",
    monthlyListings: "",
    biggestProblem: ""
  },
  user: {
    name: "Troy Massey",
    email: "agent@estatemotion.app",
    subscriptionStatus: "trial",
    creditBalance: 24
  },
  brandKit: {
    id: "",
    name: "Troy Massey",
    brokerage: "Desert North Realty",
    headshotUri: "",
    headshotPath: "",
    logoUri: "",
    logoPath: "",
    phone: "(602) 555-0148",
    email: "troy@example.com",
    website: "troymasseyrealestate.com",
    instagram: "@troysellsaz",
    primaryColor: "#111111",
    accentColor: "#C7A76C",
    ctaText: "Book a private tour",
    complianceEnabled: true,
    listingCourtesyOf: "Listing courtesy of Desert North Realty",
    brokerageDisclaimer: "Brokerage disclaimer placeholder. Agent is licensed in Arizona.",
    equalHousing: true,
    mlsDisclaimer: "MLS disclaimer placeholder. Verify all facts and availability."
  },
  project: {
    id: "",
    title: "Modern Desert Retreat",
    address: "7420 E Vista Drive",
    price: "$1,250,000",
    beds: "4",
    baths: "3.5",
    squareFeet: "3,240",
    neighborhood: "McCormick Ranch",
    city: "Scottsdale",
    listingType: "Just Listed",
    hookText: "Inside this Scottsdale retreat with resort-style living",
    caption: "A polished desert home with generous living spaces, warm natural light, and the indoor-outdoor rhythm Arizona buyers love.",
    cta: "DM me for the full tour",
    hookPreset: "Luxury",
    captionTone: "Luxury",
    reelTheme: "scottsdale-desert-luxury",
    textAnimation: "Luxury minimal",
    musicMood: "Luxury",
    outroVariation: "Headshot + CTA",
    thumbnailPreset: "Inside This Home",
    reelVariations: [],
    brandingVisible: true,
    authenticityMode: true,
    localAgentMode: true,
    photos: demoPhotos
  }
};

let state = loadState();
const app = document.querySelector("#app");
let authUser = null;
let remoteWorkspaceLoaded = featureFlags.MOCK_SUPABASE;
let saveTimer = null;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || localStorage.getItem(legacyStorageKey));
    return saved ? mergeState(defaultState, saved) : structuredClone(defaultState);
  } catch {
    return structuredClone(defaultState);
  }
}

function mergeState(base, saved) {
  return {
    ...base,
    ...saved,
    renderQueue: saved.renderQueue ?? base.renderQueue,
    selectedShowcaseId: saved.selectedShowcaseId ?? base.selectedShowcaseId,
    leads: saved.leads ?? base.leads,
    analyticsEvents: saved.analyticsEvents ?? base.analyticsEvents,
    earlyAccessForm: { ...base.earlyAccessForm, ...saved.earlyAccessForm },
    user: { ...base.user, ...saved.user },
    brandKit: { ...base.brandKit, ...saved.brandKit },
    project: { ...base.project, ...saved.project, photos: saved.project?.photos ?? base.project.photos }
  };
}

function readFeatureFlags() {
  const env = window.ESTATEMOTION_ENV ?? {};
  const params = new URLSearchParams(window.location.search);
  return {
    MOCK_AI: readFlag("MOCK_AI", env, params, true),
    MOCK_RENDERING: readFlag("MOCK_RENDERING", env, params, true),
    MOCK_STRIPE: readFlag("MOCK_STRIPE", env, params, true),
    MOCK_SUPABASE: readFlag("MOCK_SUPABASE", env, params, true),
    SUPABASE_URL: params.get("SUPABASE_URL") || env.SUPABASE_URL || env.EXPO_PUBLIC_SUPABASE_URL || "",
    SUPABASE_ANON_KEY: params.get("SUPABASE_ANON_KEY") || env.SUPABASE_ANON_KEY || env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
    SUPABASE_JS_URL: params.get("SUPABASE_JS_URL") || env.SUPABASE_JS_URL || "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm",
    OPENAI_ENDPOINT: params.get("OPENAI_ENDPOINT") || env.OPENAI_ENDPOINT || "",
    STRIPE_PUBLISHABLE_KEY: params.get("STRIPE_PUBLISHABLE_KEY") || env.STRIPE_PUBLISHABLE_KEY || env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
    STRIPE_CHECKOUT_ENDPOINT: params.get("STRIPE_CHECKOUT_ENDPOINT") || env.STRIPE_CHECKOUT_ENDPOINT || "",
    RENDER_ENDPOINT: params.get("RENDER_ENDPOINT") || env.RENDER_ENDPOINT || ""
  };
}

function readFlag(key, env, params, fallback) {
  const value = params.get(key) ?? localStorage.getItem(`ESTATEMOTION_${key}`) ?? env[key];
  if (value === undefined || value === null || value === "") return fallback;
  return value === true || value === "true" || value === "1";
}

function saveState() {
  if (shouldUseLocalPersistence()) {
    localStorage.setItem(storageKey, JSON.stringify(state));
    return;
  }
  scheduleRemoteSave();
}

function shouldUseLocalPersistence() {
  return featureFlags.MOCK_SUPABASE || isDemoRoute();
}

function appModeLabel() {
  return featureFlags.MOCK_AI || featureFlags.MOCK_RENDERING || featureFlags.MOCK_STRIPE || featureFlags.MOCK_SUPABASE ? "Mock Mode" : "Production Mode";
}

function appModeClass() {
  return appModeLabel() === "Production Mode" ? "live" : "mock";
}

function supabaseEnvError() {
  if (featureFlags.MOCK_SUPABASE) return "";
  const missing = [];
  if (!featureFlags.SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!featureFlags.SUPABASE_ANON_KEY) missing.push("SUPABASE_ANON_KEY");
  if (!missing.length) return "";
  return `Supabase is in production mode but ${missing.join(" and ")} ${missing.length === 1 ? "is" : "are"} missing. Add them in Vercel Environment Variables, or set MOCK_SUPABASE=true for local demo mode.`;
}

function localApiEnvWarning() {
  if (!window.ESTATEMOTION_API_ENV_UNAVAILABLE) return "";
  return "Local fallback active: /api/env is unavailable on the static dev server, so EstateMotion is using env.js. This is expected locally; Vercel serves /api/env in production.";
}

function isDemoRoute() {
  return routePath() === "demo";
}

function isProtectedAppRoute() {
  return routePath() === "app";
}

function routePath() {
  return window.location.pathname.replace(/^\/+|\/+$/g, "").split("/")[0];
}

function scheduleRemoteSave() {
  if (!window.EstateMotionSupabase?.enabled() || !authUser || !remoteWorkspaceLoaded) return;
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(async () => {
    try {
      const ids = await window.EstateMotionSupabase.saveWorkspace(state, authUser);
      if (ids.projectId && state.project.id !== ids.projectId) state.project.id = ids.projectId;
      if (ids.brandKitId && state.brandKit.id !== ids.brandKitId) state.brandKit.id = ids.brandKitId;
    } catch (error) {
      console.error(error);
      state = { ...state, error: error.message || "Supabase save failed." };
      render();
    }
  }, 500);
}

function setState(patch) {
  state = typeof patch === "function" ? patch(state) : { ...state, ...patch };
  saveState();
  render();
}

function showToast(message, type = "success") {
  const toast = { id: `toast-${Date.now()}`, message, type };
  state = { ...state, toasts: [...state.toasts.slice(-2), toast] };
  saveState();
  render();
  setTimeout(() => {
    state = { ...state, toasts: state.toasts.filter((item) => item.id !== toast.id) };
    saveState();
    render();
  }, 2800);
}

function setError(message) {
  setState({ error: message, loading: "" });
  showToast(message, "error");
}

function trackEvent(type, metadata = {}) {
  const event = {
    id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    metadata,
    createdAt: new Date().toISOString()
  };
  state = { ...state, analyticsEvents: [...state.analyticsEvents, event] };
  saveState();
}

function analyticsSummary() {
  const events = state.analyticsEvents;
  const pricingClicks = events.filter((event) => event.type === "pricing_click");
  const pricingCounts = pricingClicks.reduce((counts, event) => {
    const plan = event.metadata.plan ?? "Unknown";
    counts[plan] = (counts[plan] ?? 0) + 1;
    return counts;
  }, {});
  const mostClicked = Object.entries(pricingCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "None yet";
  const templateCounts = events.filter((event) => event.type === "template_select").reduce((counts, event) => {
    const templateId = event.metadata.templateId ?? "Unknown";
    counts[templateId] = (counts[templateId] ?? 0) + 1;
    return counts;
  }, {});
  const hookCounts = events.filter((event) => event.type === "hook_preset_apply").reduce((counts, event) => {
    const preset = event.metadata.preset ?? "Unknown";
    counts[preset] = (counts[preset] ?? 0) + 1;
    return counts;
  }, {});
  const visits = events.filter((event) => event.type === "demo_visit").length;
  const leads = state.leads.length;
  const leadSubmissions = events.filter((event) => event.type === "early_access_submit").length;
  const exportIntent = events.filter((event) => ["export_manifest_click", "export_preview_click", "export_copy_click", "queue_content_pack"].includes(event.type)).length;
  return {
    visits,
    leads,
    conversionRate: visits ? Math.min(100, Math.round((leadSubmissions / visits) * 100)) : 0,
    mostClicked,
    exportIntent,
    mostUsedTemplate: Object.entries(templateCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "None yet",
    mostUsedHook: Object.entries(hookCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "None yet"
  };
}

function screenToStep(screen) {
  const order = ["dashboard", "upload", "template", "preview", "export"];
  return order.indexOf(screen) + 1;
}

function routeFromUrl() {
  const path = routePath();
  if (path === "demo") return "demo";
  if (path === "app" && state.screen === "demo") return "dashboard";
  return "";
}

function navigate(screen) {
  setState({ screen });
  setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
}

function maybeStartOnboarding() {
  const route = routeFromUrl();
  if (route) {
    state.screen = route;
    saveState();
    return;
  }
  if (!state.hasOnboarded && state.screen === "dashboard") {
    state.screen = "onboarding";
    saveState();
  }
}

async function bootstrapSupabase() {
  if (featureFlags.MOCK_SUPABASE || !isProtectedAppRoute()) {
    remoteWorkspaceLoaded = true;
    return;
  }
  const envError = supabaseEnvError();
  if (envError) {
    state = { ...state, authStatus: "signed-out", error: envError };
    render();
    return;
  }
  try {
    const session = await window.EstateMotionSupabase.getSession();
    authUser = session.user;
    if (!authUser) {
      state = { ...state, authStatus: "signed-out" };
      render();
      return;
    }
    state = { ...state, authStatus: "loading", user: { ...state.user, email: authUser.email || state.user.email } };
    render();
    const workspace = await window.EstateMotionSupabase.loadWorkspace(authUser.id);
    remoteWorkspaceLoaded = true;
    state = mergeRemoteWorkspace(state, workspace);
    state.authStatus = "signed-in";
    if (!state.hasOnboarded && state.brandKit.name && state.brandKit.brokerage) state.hasOnboarded = true;
    maybeStartOnboarding();
    render();
  } catch (error) {
    console.error(error);
    state = { ...state, authStatus: "error", error: error.message || "Supabase connection failed." };
    render();
  }
}

function mergeRemoteWorkspace(current, workspace) {
  return {
    ...current,
    user: workspace.user ? {
      ...current.user,
      name: workspace.user.full_name || current.user.name,
      email: workspace.user.email || current.user.email,
      subscriptionStatus: workspace.user.subscription_status || current.user.subscriptionStatus,
      creditBalance: workspace.user.credit_balance ?? current.user.creditBalance
    } : current.user,
    brandKit: workspace.brandKit ? { ...current.brandKit, ...workspace.brandKit } : current.brandKit,
    project: workspace.project ? { ...current.project, ...workspace.project, photos: workspace.project.photos?.length ? workspace.project.photos : current.project.photos } : current.project
  };
}

async function signInWithEmail() {
  const envError = supabaseEnvError();
  if (envError) {
    setError(envError);
    return;
  }
  if (!state.authEmail.trim()) {
    setError("Enter your email address to sign in.");
    return;
  }
  setState({ loading: "Sending sign-in link...", error: "" });
  try {
    await window.EstateMotionSupabase.signInWithEmail(state.authEmail.trim());
    setState({ loading: "", authStatus: "email-sent" });
    showToast("Check your email for the sign-in link");
  } catch (error) {
    setError(error.message || "Email sign-in failed.");
  }
}

async function signInWithGoogle() {
  const envError = supabaseEnvError();
  if (envError) {
    setError(envError);
    return;
  }
  setState({ loading: "Opening Google sign-in...", error: "" });
  try {
    await window.EstateMotionSupabase.signInWithGoogle();
  } catch (error) {
    setError(error.message || "Google sign-in failed.");
  }
}

async function signOut() {
  try {
    await window.EstateMotionSupabase.signOut();
    authUser = null;
    remoteWorkspaceLoaded = false;
    state = { ...structuredClone(defaultState), authStatus: "signed-out", screen: "dashboard", toasts: [] };
    render();
  } catch (error) {
    setError(error.message || "Sign out failed.");
  }
}

function selectedTemplate() {
  return templates.find((template) => template.id === normalizeTemplateId(state.selectedTemplateId)) ?? templates[0];
}

function normalizeTemplateId(templateId) {
  const legacy = {
    "first-time-buyer": "agent-brand-builder",
    "just-listed-fast-cut": "viral-fast-cut"
  };
  return legacy[templateId] || templateId;
}

function orderedPhotos() {
  return [...state.project.photos].sort((a, b) => a.order - b.order);
}

function categorizePhoto(fileName) {
  return classifyPhoto(fileName).category;
}

function classifyPhoto(fileName, index = 0) {
  const name = String(fileName || "").toLowerCase().replaceAll("_", "-");
  const scores = Object.entries(sceneIntelligence).map(([category, config]) => {
    const keywordHits = config.keywords.filter((keyword) => name.includes(keyword)).length;
    const orderBoost = sceneOrderBoost(category, index);
    const base = category === "Detail shots" ? 0.24 : 0.18;
    const score = Math.min(0.97, base + keywordHits * 0.28 + orderBoost);
    return { category, score };
  }).sort((a, b) => b.score - a.score);
  const winner = scores[0] ?? { category: "Detail shots", score: 0.5 };
  const alternatives = scores.slice(1, 3).map((item) => item.category);
  return {
    category: winner.category,
    confidence: Math.round(winner.score * 100),
    suggestedCorrections: alternatives,
    intelligence: sceneIntelligence[winner.category]
  };
}

function sceneOrderBoost(category, index) {
  if (index === 0 && category === "Exterior hero") return 0.24;
  if (index === 1 && category === "Entry / front door") return 0.16;
  if (index >= 2 && index <= 4 && ["Kitchen", "Living room", "Dining"].includes(category)) return 0.08;
  if (index >= 5 && ["Primary bedroom", "Bathroom", "Backyard / pool"].includes(category)) return 0.06;
  return 0;
}

function sceneLabel(category) {
  if (category === "Exterior") return "Exterior hero";
  if (category === "Entry transition") return "Entry / front door";
  if (category === "Backyard") return "Backyard / pool";
  if (category === "Interior reveal") return "Living room";
  if (category === "CTA close") return "Detail shots";
  return category;
}

function sceneConfidence(photo) {
  return Math.max(35, Math.min(99, Number(photo.confidence ?? classifyPhoto(photo.fileName, photo.order - 1).confidence)));
}

function sceneSuggestions(photo) {
  return photo.suggestedCorrections?.length ? photo.suggestedCorrections : classifyPhoto(photo.fileName, photo.order - 1).suggestedCorrections;
}

function applyHookPreset(preset) {
  const template = hookPresets[preset];
  if (!template) return;
  const hook = hydratePreset(template);
  trackEvent("hook_preset_apply", { preset });
  setState((current) => ({ ...current, project: { ...current.project, hookPreset: preset, hookText: hook } }));
  showToast(`${preset} hook applied`);
}

function hydratePreset(template) {
  return String(template || "")
    .replace("{city}", state.project.city || "this market")
    .replace("{price}", state.project.price || "$X");
}

function createReelVariations() {
  return Object.entries(reelVariationPresets).map(([name, settings]) => ({
    name,
    hook: `${name}: ${state.project.hookText || hydratePreset(hookPresets.Luxury)}`,
    settings
  }));
}

function selectedReelTheme() {
  return reelThemes.find((theme) => theme.id === state.project.reelTheme) ?? reelThemes[0];
}

function selectedShowcase() {
  return showcaseProjects.find((project) => project.id === state.selectedShowcaseId) ?? showcaseProjects[0];
}

function cloneShowcaseProject(showcase) {
  return {
    ...structuredClone(showcase.project),
    photos: showcase.project.photos.map((photo, index) => ({ ...photo, order: index + 1 }))
  };
}

function loadShowcaseProject(id) {
  const showcase = showcaseProjects.find((project) => project.id === id);
  if (!showcase) {
    setError("Showcase project could not be loaded.");
    return;
  }
  setState((current) => ({
    ...current,
    selectedShowcaseId: showcase.id,
    selectedTemplateId: showcase.selectedTemplateId,
    selectedScene: 0,
    renderQueue: [],
    exportResult: null,
    error: "",
    project: cloneShowcaseProject(showcase),
    screen: "preview"
  }));
  showToast(`${showcase.title} loaded for demo`);
}

function topFeatures() {
  const photos = orderedPhotos().map((photo) => sceneLabel(photo.category));
  const featurePool = [
    photos.includes("Kitchen") ? "A kitchen designed for daily living and social hosting" : "",
    photos.includes("Living room") ? "Open living spaces with strong natural-light appeal" : "",
    photos.includes("Backyard / pool") ? "Outdoor space that extends the Arizona lifestyle" : "",
    photos.includes("Primary bedroom") ? "A primary suite that feels calm and private" : "",
    `${state.project.neighborhood} location in ${state.project.city}`
  ].filter(Boolean);
  return featurePool.slice(0, 3);
}

function generateReelVariations() {
  setState((current) => ({ ...current, project: { ...current.project, reelVariations: createReelVariations() } }));
  showToast("3 reel variations generated");
}

function aiCopy() {
  const project = state.project;
  const template = selectedTemplate();
  const localTone = {
    Phoenix: "central Phoenix convenience and everyday desert living",
    Scottsdale: "Scottsdale polish, resort energy, and indoor-outdoor appeal",
    Arcadia: "Arcadia charm, mature streets, and lifestyle-driven living",
    "Paradise Valley": "Paradise Valley privacy, views, and refined desert luxury",
    Tempe: "Tempe access, energy, and lock-and-leave convenience",
    Chandler: "Chandler comfort, schools, and easy East Valley access",
    Gilbert: "Gilbert neighborhood warmth and move-in-ready appeal",
    Mesa: "Mesa value, space, and desert views"
  };
  const phrase = project.localAgentMode ? localTone[project.city] || `${project.city} lifestyle appeal` : "a location buyers will remember";
  const hook = project.hookText || `${project.listingType}: ${project.beds} bed ${project.city} home`;
  const highlights = [
    `${project.beds} beds, ${project.baths} baths, and ${project.squareFeet} sq ft`,
    `${project.neighborhood} location with ${phrase}`,
    `${project.captionTone || "Luxury"} tone with clean, authentic listing-photo motion`
  ];
  const toneLine = captionTonePresets[project.captionTone] ?? captionTonePresets.Luxury;
  return {
    hook,
    description: `${project.address} pairs ${phrase} with polished interiors, strong curb appeal, and a short-form video story built for modern buyers.`,
    highlights,
    instagramCaption: `${hook}\n\n${project.caption}\n\n${toneLine}\n\n${project.cta}`,
    hashtags: [`#${project.city}RealEstate`, "#ArizonaHomes", "#ListingReel", "#RealEstateMarketing", "#EstateMotion"],
    voiceoverScript: `${hook}. Here are three things buyers will notice: ${highlights.join(". ")}. ${project.cta}.`
  };
}

function contentPack() {
  const copy = aiCopy();
  const photos = orderedPhotos();
  const byCategory = (categories) => photos.filter((photo) => categories.includes(sceneLabel(photo.category))).map((photo) => photo.id);
  return [
    { id: "full", title: "Full Property Reel", format: "9:16", duration: 28, hook: copy.hook, photoIds: photos.map((photo) => photo.id) },
    { id: "kitchen", title: "Kitchen Highlight", format: "9:16", duration: 12, hook: "The kitchen buyers will replay", photoIds: byCategory(["Kitchen", "Detail shots", "Living room"]) },
    { id: "curb", title: "Exterior Curb Appeal Reel", format: "1:1", duration: 10, hook: `${state.project.city} curb appeal in one glance`, photoIds: byCategory(["Exterior hero", "Backyard / pool", "Neighborhood / amenities"]) },
    { id: "story", title: "Open House Story", format: "9:16 Story", duration: 15, hook: state.project.listingType === "Open House" ? "Open house this week" : "Tour this listing", photoIds: byCategory(["Exterior hero", "Entry / front door", "Kitchen", "Living room"]) },
    { id: "top3", title: "Top 3 Features Reel", format: "9:16", duration: 18, hook: "3 things buyers will notice first", photoIds: photos.filter((photo) => ["Kitchen", "Living room", "Primary bedroom", "Backyard / pool"].includes(sceneLabel(photo.category))).slice(0, 5).map((photo) => photo.id) },
    { id: "neighborhood", title: "Neighborhood Teaser", format: "9:16", duration: 12, hook: `${state.project.neighborhood || state.project.city} lifestyle in under 15 seconds`, photoIds: byCategory(["Neighborhood / amenities", "Exterior hero", "Backyard / pool"]) },
    { id: "investor", title: "Investor Angle", format: "1:1", duration: 16, hook: "The buyer-demand angle investors should see", photoIds: photos.slice(0, 6).map((photo) => photo.id) },
    { id: "luxury", title: "Luxury Angle", format: "16:9", duration: 22, hook: copy.hook, photoIds: photos.filter((photo) => sceneConfidence(photo) >= 65).map((photo) => photo.id) },
    { id: "viral", title: "Viral Social Angle", format: "9:16", duration: 11, hook: "Would you live here?", photoIds: photos.slice(0, 5).map((photo) => photo.id) },
    { id: "copy", title: "Caption + Hashtags", format: "Text", duration: 0, hook: copy.instagramCaption, photoIds: [] }
  ];
}

function contentPackCard(item) {
  const queueItem = state.renderQueue.find((job) => job.packId === item.id);
  return `
    <article class="export-card pack-card">
      <div>
        <strong>${item.title}</strong>
        <small>${item.format}${item.duration ? ` - ${item.duration}s` : ""} - ${escapeHtml(item.hook)}</small>
      </div>
      <span class="queue-pill ${queueItem?.status ?? "queued"}">${queueItem?.status ?? "not queued"}</span>
    </article>
  `;
}

function renderQueueSummary() {
  if (!state.renderQueue.length) {
    return `<section class="panel compact"><div class="section-title"><p>Render queue</p><h3>No queued renders yet</h3></div><p class="muted">Queue the content pack from Export when you are ready.</p></section>`;
  }
  return `
    <section class="panel compact">
      <div class="section-title"><p>Render queue</p><h3>${state.renderQueue.length} assets</h3></div>
      ${state.renderQueue.slice(0, 4).map((job) => `<div class="queue-row"><span>${escapeHtml(job.title)}</span><b class="${job.status}">${job.status}</b></div>`).join("")}
    </section>
  `;
}

function updateProject(key, value) {
  setState((current) => ({ ...current, error: "", project: { ...current.project, [key]: value } }));
}

function updateBrand(key, value) {
  setState((current) => ({ ...current, error: "", brandKit: { ...current.brandKit, [key]: value } }));
}

function updateEarlyAccess(key, value) {
  setState((current) => ({ ...current, error: "", earlyAccessForm: { ...current.earlyAccessForm, [key]: value } }));
}

function resetProject() {
  setState({ ...structuredClone(defaultState), screen: "create" });
  showToast("Demo project reset");
}

function resetDemoMode() {
  localStorage.removeItem(storageKey);
  localStorage.removeItem(legacyStorageKey);
  state = { ...structuredClone(defaultState), hasOnboarded: true, screen: "dashboard", toasts: [] };
  saveState();
  render();
  showToast("Demo mode restored");
}

function validateBrandKit() {
  if (!state.brandKit.name.trim()) return "Agent name is required.";
  if (!state.brandKit.brokerage.trim()) return "Brokerage is required.";
  return "";
}

function validateProjectBasics() {
  const brandError = validateBrandKit();
  if (brandError) return brandError;
  if (!state.project.address.trim()) return "Property address is required.";
  return "";
}

function validatePhotos() {
  if (orderedPhotos().length < 3) return "Upload or add at least 3 listing photos.";
  return "";
}

function validateTemplate() {
  if (!templates.some((template) => template.id === normalizeTemplateId(state.selectedTemplateId))) return "Choose a template before previewing.";
  return "";
}

function guard(error, next) {
  if (error) {
    setError(error);
    return;
  }
  setState({ error: "" });
  next();
}

function field(label, key, options = {}) {
  const value = state.project[key] ?? "";
  if (options.type === "textarea") {
    return `<div class="field"><label>${label}</label><textarea data-project="${key}">${escapeHtml(value)}</textarea></div>`;
  }
  if (options.choices) {
    return `<div class="field"><label>${label}</label><select data-project="${key}">${options.choices.map((choice) => `<option ${choice === value ? "selected" : ""}>${choice}</option>`).join("")}</select></div>`;
  }
  return `<div class="field"><label>${label}</label><input data-project="${key}" value="${escapeAttr(value)}"></div>`;
}

function brandField(label, key) {
  return `<div class="field"><label>${label}</label><input data-brand="${key}" value="${escapeAttr(state.brandKit[key] ?? "")}"></div>`;
}

function brandTextarea(label, key) {
  return `<div class="field"><label>${label}</label><textarea data-brand="${key}">${escapeHtml(state.brandKit[key] ?? "")}</textarea></div>`;
}

function brandToggle(label, key) {
  return `<label class="toggle-row"><span>${label}</span><input type="checkbox" data-brand="${key}" ${state.brandKit[key] ? "checked" : ""}></label>`;
}

function leadField(label, key, options = {}) {
  const value = state.earlyAccessForm[key] ?? "";
  if (options.type === "textarea") {
    return `<div class="field"><label>${label}</label><textarea data-lead="${key}">${escapeHtml(value)}</textarea></div>`;
  }
  return `<div class="field"><label>${label}</label><input data-lead="${key}" value="${escapeAttr(value)}"></div>`;
}

function renderLayout(content) {
  const stepLabel = state.screen === "pricing" ? "Pricing" : screenToStep(state.screen) > 0 ? `Step ${screenToStep(state.screen)} of 5` : "AI reel studio";
  const navItems = [
    { screen: "demo", label: "Launch" },
    { screen: "dashboard", label: "Studio" },
    { screen: "upload", label: "Upload" },
    { screen: "template", label: "Style" },
    { screen: "preview", label: "Preview" },
    { screen: "export", label: "Export" }
  ];
  app.innerHTML = `
    <main class="app">
      <aside class="side-nav">
        <div class="side-brand">
          <span>EM</span>
          <div>
            <strong>EstateMotion</strong>
            <small>AI listing media studio</small>
          </div>
        </div>
        <nav>
          ${navItems.map((item) => `<button class="${state.screen === item.screen ? "active" : ""}" data-nav="${item.screen}"><span>${item.label}</span><small>${navMicrocopy(item.screen)}</small></button>`).join("")}
        </nav>
        <div class="side-proof">
          <span>Positioning</span>
          <strong>Built for agents who sell status, speed, and story.</strong>
        </div>
      </aside>
      <header class="topbar">
        <div class="brand">
          <p>EstateMotion</p>
          <h1>${stepLabel}</h1>
        </div>
        <div class="top-actions">
          <span class="status-dot ${appModeClass()}">${appModeLabel()}</span>
          <span class="status-dot ${featureFlags.MOCK_RENDERING ? "mock" : "live"}">${featureFlags.MOCK_RENDERING ? "Mock render" : "Live render"}</span>
          <span class="status-dot ${featureFlags.MOCK_SUPABASE ? "mock" : "live"}">${featureFlags.MOCK_SUPABASE ? "Mock data" : "Supabase"}</span>
          <span class="credit-pill">${state.user.creditBalance} credits</span>
          ${!featureFlags.MOCK_SUPABASE && authUser ? `<button class="reset-demo" data-sign-out>Sign out</button>` : ""}
          <button class="reset-demo" data-reset-demo>Reset demo</button>
        </div>
      </header>
      <section class="screen">
        ${localApiEnvWarning() ? `<div class="state-banner warning-state"><strong>Local env fallback</strong><span>${escapeHtml(localApiEnvWarning())}</span></div>` : ""}
        ${state.error ? `<div class="state-banner error-state"><strong>Needs attention</strong><span>${escapeHtml(state.error)}</span></div>` : ""}
        ${state.loading ? `<div class="state-banner loading-state"><span class="spinner"></span><strong>${escapeHtml(state.loading)}</strong></div>` : ""}
        ${content}
      </section>
      <nav class="bottom-nav">
        ${navItems.map((item) => `<button class="${state.screen === item.screen ? "active" : ""}" data-nav="${item.screen}">${item.label}</button>`).join("")}
      </nav>
      <div class="toast-stack">${state.toasts.map((toast) => `<div class="toast ${toast.type}">${escapeHtml(toast.message)}</div>`).join("")}</div>
    </main>
  `;
  document.querySelectorAll("[data-nav]").forEach((button) => button.addEventListener("click", () => navigate(button.dataset.nav)));
  document.querySelector("[data-reset-demo]").addEventListener("click", resetDemoMode);
  document.querySelector("[data-sign-out]")?.addEventListener("click", signOut);
  bindInputs();
}

function navMicrocopy(screen) {
  const labels = {
    demo: "Outcome page",
    dashboard: "Reel command",
    upload: "Listing photos",
    template: "Video style",
    preview: "Review reel",
    export: "Social assets"
  };
  return labels[screen] || "Workspace";
}

function bindInputs() {
  document.querySelectorAll("[data-project]").forEach((input) => {
    input.addEventListener("input", () => updateProject(input.dataset.project, input.type === "checkbox" ? input.checked : input.value));
  });
  document.querySelectorAll("[data-brand]").forEach((input) => {
    input.addEventListener("input", () => updateBrand(input.dataset.brand, input.type === "checkbox" ? input.checked : input.value));
  });
  document.querySelectorAll("[data-lead]").forEach((input) => {
    input.addEventListener("input", () => updateEarlyAccess(input.dataset.lead, input.value));
  });
  document.querySelectorAll("[data-auth]").forEach((input) => {
    input.addEventListener("input", () => setState({ authEmail: input.value, error: "" }));
  });
}

function renderDashboard() {
  const photo = orderedPhotos()[0] ?? demoPhotos[0];
  const pack = contentPack();
  const queueSummary = renderQueueSummary();
  const hasPhotos = orderedPhotos().length > 0;
  const showcase = selectedShowcase();
  renderLayout(`
    <section class="dashboard-command">
      <div class="dashboard-copy">
        <p class="eyebrow">${state.user.subscriptionStatus} workspace / AI reel studio</p>
        <h2>Upload photos. Get the reel.</h2>
        <p>EstateMotion turns listing photography into a finished, branded, social-ready reel with captions, thumbnails, and export packs in minutes.</p>
        <div class="actions">
          <button class="primary" data-action="one-click">One-Click Reel</button>
          <button class="secondary" data-action="continue">Upload photos</button>
          <button class="ghost" data-action="new">Reset demo</button>
        </div>
      </div>
      <div class="dashboard-reel-card">
        ${miniReelPreview(photo, "dashboard")}
      </div>
    </section>
    <section class="quick-flow panel elevated">
      ${quickStep("1", "Upload", `${orderedPhotos().length} photos`)}
      ${quickStep("2", "Style", selectedTemplate().name)}
      ${quickStep("3", "Preview", `${reelPacing(orderedPhotos()).length || 0} scenes`)}
      ${quickStep("4", "Export", `${contentPack().length} assets`)}
    </section>
    <section class="luxury-metrics">
      ${metricCard("Assets in pack", pack.length)}
      ${metricCard("Photos sequenced", orderedPhotos().length)}
      ${metricCard("Export intent", analyticsSummary().exportIntent)}
      ${metricCard("Credits", state.user.creditBalance)}
    </section>
    <section class="panel brand-authority">
      <div class="section-title"><p>Agent authority layer</p><h3>${escapeHtml(state.brandKit.name)} / ${escapeHtml(state.brandKit.brokerage)}</h3></div>
      <p class="muted">Every reel closes with personal brand authority, brokerage trust, clean compliance language, and a social-first CTA built for high-intent DMs.</p>
      <div class="authority-grid">
        <span>Brokerage trust</span>
        <span>Luxury pacing</span>
        <span>AI copy system</span>
        <span>Social conversion</span>
      </div>
    </section>
    <section class="panel showcase-section">
      <div class="section-title"><p>Internal Showcase Mode</p><h3>Showcase Projects</h3></div>
      <p class="muted">Prebuilt, presentation-ready listings for sales calls, partner meetings, and founder-led validation.</p>
      <div class="showcase-grid">
        ${showcaseProjects.map((project) => showcaseCard(project)).join("")}
      </div>
    </section>
    <section class="panel showcase-comparison">
      <div class="section-title"><p>Side-by-side comparison</p><h3>${escapeHtml(showcase.title)}</h3></div>
      <div class="comparison-grid">
        ${showcase.project.reelVariations.map((variation) => comparisonCard(variation)).join("")}
      </div>
    </section>
    <section class="panel why-section">
      <div class="section-title"><p>Why this works</p><h3>Sales demo talking points</h3></div>
      <div class="why-grid">
        ${Object.entries(showcase.whyThisWorks).map(([label, body]) => `<article><span>${escapeHtml(label)}</span><strong>${escapeHtml(body)}</strong></article>`).join("")}
      </div>
    </section>
    <section class="panel sample-section">
      <div class="section-title"><p>Sample projects</p><h3>Ready for demo</h3></div>
      <div class="sample-grid">
        ${sampleProjects.map((project) => `<article class="sample-card"><img src="${project.thumbnail}" alt=""><span>${project.type}</span><strong>${project.title}</strong><small>${project.location}</small></article>`).join("")}
      </div>
    </section>
    ${!hasPhotos ? emptyState("No listing photos yet", "Upload at least 3 photos to generate a reel preview.") : ""}
    <section class="project-thumbnails">
      ${orderedPhotos().slice(0, 5).map((item, index) => `<article><img src="${item.uri}" alt=""><span>${index + 1}</span><strong>${escapeHtml(item.category)}</strong></article>`).join("")}
    </section>
    ${queueSummary}
    <section class="panel">
      <div class="section-title"><p>AI generated</p><h3>Content Pack</h3></div>
      <div class="pack-grid">${pack.map((item) => contentPackCard(item)).join("")}</div>
    </section>
  `);
  document.querySelector('[data-action="one-click"]').addEventListener("click", oneClickReel);
  document.querySelector('[data-action="continue"]').addEventListener("click", () => navigate("upload"));
  document.querySelector('[data-action="new"]').addEventListener("click", resetProject);
  document.querySelectorAll("[data-showcase-id]").forEach((button) => {
    button.addEventListener("click", () => loadShowcaseProject(button.dataset.showcaseId));
  });
}

function quickStep(number, title, value) {
  return `<article><span>${number}</span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(value)}</small></article>`;
}

function miniReelPreview(photo, variant = "") {
  const copy = aiCopy();
  const theme = selectedReelTheme();
  return `
    <div class="mini-reel ${variant}" style="--reel-accent:${theme.accent}">
      <img src="${photo.uri}" alt="">
      <div class="mini-reel-shade"></div>
      <div class="mini-reel-top"><span>EstateMotion</span><b>9:16</b></div>
      <div class="mini-reel-copy">
        <strong>${escapeHtml(copy.hook)}</strong>
        <small>${escapeHtml(state.project.price)} / ${escapeHtml(state.project.city)} / ${escapeHtml(state.project.beds)} BD</small>
      </div>
      <div class="mini-reel-agent">${escapeHtml(state.brandKit.name)} / ${escapeHtml(state.brandKit.brokerage)}</div>
    </div>
  `;
}

function showcaseCard(project) {
  const active = state.selectedShowcaseId === project.id;
  return `
    <article class="showcase-card ${active ? "selected" : ""}">
      <img src="${project.thumbnail}" alt="">
      <div>
        <span>${escapeHtml(project.type)}</span>
        <strong>${escapeHtml(project.title)}</strong>
        <small>${escapeHtml(project.location)} - ${escapeHtml(project.price)}</small>
      </div>
      <p>${escapeHtml(project.themeLabel)} - ${project.project.photos.length} photos - ${project.project.reelVariations.length} variations</p>
      <button class="primary" data-showcase-id="${project.id}">Demo This Project</button>
    </article>
  `;
}

function comparisonCard(variation) {
  const theme = reelThemes.find((item) => item.id === variation.settings.reelTheme) ?? reelThemes[0];
  return `
    <article class="comparison-card" style="--comparison-accent:${theme.accent};--comparison-bg:${theme.background}">
      <span>${escapeHtml(variation.name)}</span>
      <strong>${escapeHtml(theme.name)}</strong>
      <small>${escapeHtml(variation.settings.textAnimation)} text - ${escapeHtml(variation.settings.musicMood)} music</small>
      <p>${escapeHtml(variation.hook)}</p>
    </article>
  `;
}

function renderDemoLanding() {
  trackDemoVisitOnce();
  renderLayout(`
    <section class="demo-hero panel elevated">
      <p class="eyebrow">Luxury AI video creation for modern agents</p>
      <h2>Turn listing photos into finished real estate reels in minutes.</h2>
      <p>Upload the property gallery. EstateMotion builds the sequence, hook, motion, captions, thumbnail, brand end card, and export pack so agents leave with content they can actually post.</p>
      <div class="actions">
        <button class="primary" data-nav="dashboard">Open product demo</button>
        <button class="secondary" data-scroll-leads>Request early access</button>
      </div>
    </section>
    <section class="outcome-flow">
      <article><span>01</span><strong>Upload photos</strong><small>Bring the existing listing gallery.</small></article>
      <article><span>02</span><strong>AI builds the reel</strong><small>Scene order, pacing, overlays, hook, and CTA.</small></article>
      <article><span>03</span><strong>Export social-ready content</strong><small>Reel, caption, hashtags, thumbnail, and content pack.</small></article>
    </section>
    <section class="luxury-metrics">
      ${metricCard("Launch assets", "5")}
      ${metricCard("Formats", "Reels / Stories / Shorts")}
      ${metricCard("Setup time", "Minutes")}
      ${metricCard("Brand control", "Agent + Brokerage")}
    </section>
    <section class="panel founder-story">
      <div class="section-title"><p>Founder thesis</p><h3>Built for agents becoming media brands.</h3></div>
      <p>Luxury listings already have the raw material: photography, architecture, neighborhood context, and agent trust. EstateMotion turns those ingredients into social-native campaigns without making the property look fake, cheap, or overproduced.</p>
    </section>
    <section class="panel transformation-section">
      <div class="section-title"><p>Before / after</p><h3>From static MLS gallery to launch campaign</h3></div>
      <div class="comparison-grid">
        <article class="comparison-card before-card"><span>Before</span><strong>25 photos sitting in a folder</strong><small>No hook, no pacing, no CTA, no personal brand lift.</small><p>Agents post late, inconsistently, or outsource simple listing content.</p></article>
        <article class="comparison-card"><span>After</span><strong>Premium content pack</strong><small>Full reel, highlights, story, caption, hashtags, and end card.</small><p>Every listing becomes a fast, polished social launch moment.</p></article>
        <article class="comparison-card pro-card"><span>Result</span><strong>More authority per listing</strong><small>Looks premium enough for sellers and native enough for buyers.</small><p>The agent is positioned as a marketer, not just a license holder.</p></article>
      </div>
    </section>
    <section class="panel">
      <div class="section-title"><p>How it works</p><h3>Outcome-first workflow</h3></div>
      <div class="steps-grid">
        <article><span>1</span><strong>Upload listing photos</strong><small>Use real MLS or photographer images from the property.</small></article>
        <article><span>2</span><strong>AI builds the reel</strong><small>EstateMotion creates scene order, pacing, hook, feature cards, and CTA.</small></article>
        <article><span>3</span><strong>Export reels, captions, and content packs</strong><small>Leave with launch assets for Reels, Stories, Shorts, and Instagram.</small></article>
      </div>
    </section>
    <section class="panel modern-agents">
      <div class="section-title"><p>Built for modern agents</p><h3>Status, speed, and repeatable content operations.</h3></div>
      <div class="steps-grid">
        <article><span>A</span><strong>Solo agents</strong><small>Look like a premium media team without hiring one.</small></article>
        <article><span>B</span><strong>Brokerages</strong><small>Standardize listing launch quality and compliance language.</small></article>
        <article><span>C</span><strong>Personal brands</strong><small>Turn every listing into proof of taste, authority, and market presence.</small></article>
      </div>
    </section>
    <section class="panel">
      <div class="section-title"><p>Pricing test</p><h3>What would agents pay?</h3></div>
      <div class="pricing-grid">
        ${pricingCard("Starter", "$19/export", "1 content pack", "For agents with occasional listings.", "Test price")}
        ${pricingCard("Pro", "$49/month", "Monthly content credits", "For agents posting every week.", "Test price")}
        ${pricingCard("Brokerage", "Custom", "Team workflow", "For offices that need compliance and brand control.", "Test price")}
      </div>
    </section>
    <section class="panel testimonials">
      <div class="section-title"><p>Early signal</p><h3>What brokerages should feel immediately</h3></div>
      <div class="steps-grid">
        <article><strong>"This makes us look faster and more expensive."</strong><small>Placeholder seller-facing brokerage reaction.</small></article>
        <article><strong>"I would use this for every listing launch."</strong><small>Placeholder agent validation quote.</small></article>
        <article><strong>"This solves the content bottleneck."</strong><small>Placeholder team lead reaction.</small></article>
      </div>
    </section>
    <section class="panel elevated" id="earlyAccess">
      <div class="section-title"><p>Request Early Access</p><h3>Founder call lead capture</h3></div>
      <div class="grid-2">${leadField("Name", "name")}${leadField("Email", "email")}</div>
      <div class="grid-2">${leadField("Brokerage", "brokerage")}${leadField("City", "city")}</div>
      ${leadField("Monthly listings", "monthlyListings")}
      ${leadField("Biggest content problem", "biggestProblem", { type: "textarea" })}
      <div class="actions">
        <button class="primary" data-submit-lead>Submit request</button>
        <button class="secondary" data-export-leads>Export CSV (${state.leads.length})</button>
      </div>
      ${state.leads.length ? `<div class="lead-list">${state.leads.slice(-3).reverse().map((lead) => `<article><strong>${escapeHtml(lead.name)}</strong><span>${escapeHtml(lead.email)} - ${escapeHtml(lead.city)}</span></article>`).join("")}</div>` : emptyState("No early-access requests yet", "Submissions are stored locally for founder validation.")}
    </section>
  `);
  document.querySelector("[data-scroll-leads]").addEventListener("click", () => document.querySelector("#earlyAccess").scrollIntoView({ behavior: "smooth" }));
  document.querySelector("[data-submit-lead]").addEventListener("click", submitLead);
  document.querySelector("[data-export-leads]").addEventListener("click", exportLeadsCsv);
  bindPricingTracking();
}

function renderDemoLandingPremium() {
  trackDemoVisitOnce();
  renderLayout(`
    <section class="landing-hero">
      <div class="landing-hero-copy">
        <p class="eyebrow">AI real estate media studio</p>
        <h2>Finished listing reels from photos in minutes.</h2>
        <p>EstateMotion turns real listing photography into premium Reels, Shorts, captions, thumbnails, and content packs without hiring a videographer.</p>
        <div class="actions">
          <button class="primary" data-nav="dashboard">Try the product demo</button>
          <button class="secondary" data-scroll-leads>Request early access</button>
        </div>
        <div class="hero-proof-row">
          <span>Real property photos</span>
          <span>Brand end cards</span>
          <span>Social-ready exports</span>
        </div>
      </div>
      <div class="landing-device-stage">
        <div class="device-frame phone-main">${miniReelPreview(orderedPhotos()[0] ?? demoPhotos[0], "hero")}</div>
        <div class="device-frame phone-secondary">${miniReelPreview(orderedPhotos()[2] ?? demoPhotos[2], "hero-alt")}</div>
        <div class="device-caption"><strong>AI-built listing reel</strong><span>Hook / motion / CTA / brand card</span></div>
      </div>
    </section>
    <section class="luxury-metrics">
      ${metricCard("Output", "Reel + pack")}
      ${metricCard("Setup", "Minutes")}
      ${metricCard("Formats", "9:16 / 1:1 / 16:9")}
      ${metricCard("Branding", "Agent + brokerage")}
    </section>
    <section class="landing-section split-showcase">
      <div class="section-title"><p>Before / after</p><h3>From photo folder to launch campaign.</h3></div>
      <div class="transformation-grid">
        <article class="transform-card before">
          <span>Before</span>
          <strong>Static listing photos</strong>
          <small>No hook. No pacing. No CTA. No personal brand lift.</small>
          <div class="photo-stack">${demoPhotos.slice(0, 3).map((photo) => `<img src="${photo.uri}" alt="">`).join("")}</div>
        </article>
        <article class="transform-card after">
          <span>After</span>
          <strong>Finished reel + content pack</strong>
          <small>Social-ready video assets sellers can feel and buyers can replay.</small>
          ${miniReelPreview(demoPhotos[0], "after")}
        </article>
      </div>
    </section>
    <section class="landing-section">
      <div class="section-title centered"><p>How it works</p><h3>Three steps from listing gallery to polished reel.</h3></div>
      <div class="landing-steps">
        <article><span>01</span><strong>Upload photos</strong><small>Select the real listing images you already have.</small></article>
        <article><span>02</span><strong>AI builds the reel</strong><small>EstateMotion sorts scenes, writes the hook, adds motion, and prepares brand cards.</small></article>
        <article><span>03</span><strong>Export content</strong><small>Download Reels, captions, hashtags, thumbnails, and content-pack assets.</small></article>
      </div>
    </section>
    <section class="landing-section template-landing">
      <div class="section-title centered"><p>Template systems</p><h3>Designed for luxury, social speed, and brokerage trust.</h3></div>
      <div class="template-showcase landing-template-showcase">
        ${templates.map((template) => templateChoiceCard(template)).join("")}
      </div>
    </section>
    <section class="landing-section trust-section">
      <div class="section-title centered"><p>Trust signal</p><h3>What agents and brokerages should feel immediately.</h3></div>
      <div class="testimonial-grid">
        <article><strong>"This is easier than hiring a videographer for every listing."</strong><small>Agent validation target</small></article>
        <article><strong>"It makes our listings look faster, more premium, and more consistent."</strong><small>Brokerage validation target</small></article>
        <article><strong>"The end card turns every property into a personal-brand asset."</strong><small>Team lead validation target</small></article>
      </div>
    </section>
    <section class="landing-section pricing-landing">
      <div class="section-title centered"><p>Pricing</p><h3>Simple plans for listing launches.</h3></div>
      <div class="pricing-grid">
        ${pricingCard("Starter", "$19/export", "1 content pack", "For agents with occasional listings.", "Test price")}
        ${pricingCard("Pro", "$49/month", "Monthly content credits", "For agents posting every week.", "Test price")}
        ${pricingCard("Brokerage", "Custom", "Team workflow", "For offices that need compliance and brand control.", "Test price")}
      </div>
    </section>
    <section class="landing-section founder-panel">
      <div>
        <p class="eyebrow">Founder story</p>
        <h3>Built from the reality of modern real estate marketing.</h3>
      </div>
      <p>Listings already come with the raw material: photography, architecture, neighborhood context, and agent trust. EstateMotion turns those ingredients into social-native campaigns without making the property feel fake, overproduced, or generic.</p>
    </section>
    <section class="landing-section faq-section">
      <div class="section-title centered"><p>FAQ</p><h3>Built for real listing content, not fantasy video.</h3></div>
      <div class="faq-grid">
        ${faqItem("Does EstateMotion invent rooms?", "No. EstateMotion is built around real listing photos, realistic motion, clean overlays, and brand/compliance cards.")}
        ${faqItem("Can I export for Instagram and YouTube?", "Yes. The render manifest supports 9:16 Reels, 1:1 social posts, and 16:9 YouTube or web versions.")}
        ${faqItem("Can brokerages use compliance language?", "Yes. Brand kits include listing courtesy, brokerage disclaimer, Equal Housing, and MLS disclaimer placeholders.")}
        ${faqItem("Is rendering live today?", "The static demo supports mock exports. Live MP4 rendering is wired through the separate Remotion render worker and Supabase Storage.")}
      </div>
    </section>
    <section class="landing-section early-access-panel elevated" id="earlyAccess">
      <div class="early-access-copy">
        <p class="eyebrow">Request Early Access</p>
        <h3>Show us your listing workflow. We’ll show you the reel.</h3>
        <p>Local submissions are saved for founder-led validation and CSV export.</p>
      </div>
      <div class="early-access-form">
        <div class="grid-2">${leadField("Name", "name")}${leadField("Email", "email")}</div>
        <div class="grid-2">${leadField("Brokerage", "brokerage")}${leadField("City", "city")}</div>
        ${leadField("Monthly listings", "monthlyListings")}
        ${leadField("Biggest content problem", "biggestProblem", { type: "textarea" })}
        <div class="actions">
          <button class="primary" data-submit-lead>Submit request</button>
          <button class="secondary" data-export-leads>Export CSV (${state.leads.length})</button>
        </div>
        ${state.leads.length ? `<div class="lead-list">${state.leads.slice(-3).reverse().map((lead) => `<article><strong>${escapeHtml(lead.name)}</strong><span>${escapeHtml(lead.email)} - ${escapeHtml(lead.city)}</span></article>`).join("")}</div>` : emptyState("No early-access requests yet", "Submissions are stored locally for founder validation.")}
      </div>
    </section>
  `);
  document.querySelector("[data-scroll-leads]").addEventListener("click", () => document.querySelector("#earlyAccess").scrollIntoView({ behavior: "smooth" }));
  document.querySelector("[data-submit-lead]").addEventListener("click", submitLead);
  document.querySelector("[data-export-leads]").addEventListener("click", exportLeadsCsv);
  bindPricingTracking();
}

function faqItem(question, answer) {
  return `<article><strong>${escapeHtml(question)}</strong><p>${escapeHtml(answer)}</p></article>`;
}

function renderAuth() {
  const envError = supabaseEnvError();
  renderLayout(`
    <section class="auth-panel panel elevated">
      <p class="eyebrow">EstateMotion App</p>
      <h2>Sign in to continue</h2>
      <p>Supabase Auth protects the production workspace. Demo mode remains public at <a href="/demo">/demo</a>.</p>
      ${envError ? `<div class="state-banner error-state"><strong>Supabase setup needed</strong><span>${escapeHtml(envError)}</span></div>` : ""}
      <div class="field">
        <label>Email</label>
        <input data-auth="email" type="email" placeholder="agent@example.com" value="${escapeAttr(state.authEmail)}">
      </div>
      <div class="actions">
        <button class="primary" data-auth-email ${envError ? "disabled" : ""}>Send magic link</button>
        <button class="secondary" data-auth-google ${envError ? "disabled" : ""}>Continue with Google</button>
      </div>
      ${state.authStatus === "email-sent" ? `<div class="state-banner loading-state"><strong>Magic link sent</strong><span>Open the link from your email to finish signing in.</span></div>` : ""}
    </section>
  `);
  document.querySelector("[data-auth-email]").addEventListener("click", signInWithEmail);
  document.querySelector("[data-auth-google]").addEventListener("click", signInWithGoogle);
}

function trackDemoVisitOnce() {
  const key = `estatemotion.demo.visit.${window.location.pathname}`;
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, "true");
  trackEvent("demo_visit", { path: window.location.pathname || "/demo" });
}

function renderOnboarding() {
  renderLayout(`
    <div class="screen-title cinematic-title"><p class="eyebrow">Agent onboarding</p><h2>Build the brand layer once.</h2><p>These details turn every listing into a polished, personal-brand media asset with brokerage trust built in.</p></div>
    <section class="panel elevated">
      <div class="grid-2">${brandField("Name", "name")}${brandField("Brokerage", "brokerage")}</div>
      <div class="grid-2">${brandField("Headshot URL", "headshotUri")}${brandField("Logo URL", "logoUri")}</div>
      <div class="grid-2">
        <div class="field"><label>Upload headshot</label><input type="file" accept="image/*" data-brand-upload="headshot"></div>
        <div class="field"><label>Upload logo</label><input type="file" accept="image/*" data-brand-upload="logo"></div>
      </div>
      <div class="grid-2">${brandField("Phone", "phone")}${brandField("Website", "website")}</div>
      <div class="grid-2">${brandField("Email", "email")}${brandField("Instagram", "instagram")}</div>
      ${brandField("CTA text", "ctaText")}
      <button class="primary" data-finish-onboarding>Start dashboard</button>
    </section>
  `);
  document.querySelector("[data-finish-onboarding]").addEventListener("click", () => guard(validateBrandKit(), () => {
    setState({ hasOnboarded: true, screen: "dashboard", error: "" });
    showToast("Brand kit saved");
  }));
  bindBrandUploads();
}

function renderCreate() {
  renderLayout(`
    <div class="screen-title cinematic-title"><p class="eyebrow">Quick setup</p><h2>Tell EstateMotion what this listing is.</h2><p>Only the basics are needed to build a social-ready reel. Extra controls stay tucked away for power users.</p></div>
    <section class="panel quick-project-panel">
      <div class="grid-2">${field("Property address", "address")}${field("Price", "price")}</div>
      <div class="grid-2">${field("City", "city")}${field("Listing type", "listingType", { choices: ["Just Listed", "Open House", "Price Drop", "Coming Soon", "Sold", "For Rent"] })}</div>
      <details class="advanced-panel">
        <summary>Advanced listing details</summary>
        ${field("Property title", "title")}
        <div class="grid-2">${field("Neighborhood", "neighborhood")}${field("Square footage", "squareFeet")}</div>
        <div class="grid-2">${field("Beds", "beds")}${field("Baths", "baths")}</div>
        <div class="mode-grid">
          <label class="toggle-row"><span>Authenticity Mode</span><input type="checkbox" data-project="authenticityMode" ${state.project.authenticityMode ? "checked" : ""}></label>
          <label class="toggle-row"><span>Local Agent Mode</span><input type="checkbox" data-project="localAgentMode" ${state.project.localAgentMode ? "checked" : ""}></label>
        </div>
      </details>
      <button class="primary" data-next="upload">Continue to upload</button>
    </section>
  `);
  document.querySelector("[data-next]").addEventListener("click", () => guard(validateProjectBasics(), () => {
    showToast("Project details saved");
    navigate("upload");
  }));
}

function renderUpload() {
  const photos = orderedPhotos();
  renderLayout(`
    <div class="screen-title cinematic-title"><p class="eyebrow">Upload photos</p><h2>Drop in the listing gallery.</h2><p>EstateMotion handles the scene order, pacing, hook, Top 3 Features, and CTA. Pro controls are still here when you want them.</p></div>
    <section class="studio-strip">
      <span>Exterior hero</span>
      <span>Interior rhythm</span>
      <span>Feature proof</span>
      <span>Brand end card</span>
    </section>
    <label class="upload-zone" data-upload-zone>
      <input id="photoInput" type="file" accept="image/*" multiple>
      <span class="upload-plus">+</span>
      <strong>Select 5-25 property photos</strong>
      <span class="muted">Drag and drop images here, or use Add More Photos. Select All from Folder works in the file picker.</span>
      <b class="upload-count">${photos.length} photo${photos.length === 1 ? "" : "s"} uploaded.</b>
    </label>
    <div class="actions">
      <button class="primary" data-add-more type="button">Add More Photos</button>
      <button class="primary" data-one-click>One-Click Reel</button>
      <button class="ghost" data-demo>Add demo photos</button>
      <button class="secondary" data-next="template">Choose style</button>
    </div>
    <details class="advanced-panel">
      <summary>Pro Controls: scene intelligence and manual order</summary>
      <section class="panel engine-panel">
        <div class="section-title"><p>Reel-E style workflow engine</p><h3>Smart scene intelligence</h3></div>
        <div class="engine-grid">
          ${engineMetric("Avg confidence", `${averageConfidence(photos)}%`)}
          ${engineMetric("Scene types found", new Set(photos.map((photo) => sceneLabel(photo.category))).size || 0)}
          ${engineMetric("Motion system", selectedMotionSystem().tempo)}
          ${engineMetric("Render-ready scenes", photos.length)}
        </div>
        <p class="muted">Magic Sort uses filename, order, and real estate scene logic to suggest a listing flow. Manual overrides stay available for accuracy.</p>
        <div class="actions">
          <button class="secondary" data-featured-flow>Best Listing Flow</button>
          <button class="secondary" data-sort>Magic Sort Intelligence</button>
        </div>
      </section>
    </details>
    <section class="photo-grid">
      ${photos.length ? photos.map((photo, index) => photoCard(photo, index)).join("") : emptyState("No photos selected", "Choose listing photos or add demo photos to continue.")}
    </section>
  `);
  const input = document.querySelector("#photoInput");
  input.addEventListener("change", handlePhotoFiles);
  document.querySelector("[data-add-more]").addEventListener("click", () => input.click());
  bindUploadDropZone();
  document.querySelector("[data-one-click]").addEventListener("click", oneClickReel);
  document.querySelector("[data-sort]")?.addEventListener("click", sortPhotos);
  document.querySelector("[data-featured-flow]")?.addEventListener("click", applyFeaturedPropertyFlow);
  document.querySelector("[data-demo]").addEventListener("click", () => {
    setState((current) => ({ ...current, error: "", project: { ...current.project, photos: demoPhotos } }));
    showToast("Demo photos loaded");
  });
  document.querySelector("[data-next]").addEventListener("click", () => guard(validatePhotos(), () => navigate("template")));
  bindPhotoControls();
}

function averageConfidence(photos) {
  if (!photos.length) return 0;
  return Math.round(photos.reduce((sum, photo) => sum + sceneConfidence(photo), 0) / photos.length);
}

function engineMetric(label, value) {
  return `<article><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`;
}

function photoCard(photo, index) {
  const confidence = sceneConfidence(photo);
  const suggestions = sceneSuggestions(photo).filter((item) => item !== sceneLabel(photo.category)).slice(0, 2);
  return `
    <article class="photo-card" draggable="true" data-photo-id="${photo.id}">
      <div class="photo-thumb"><img src="${photo.uri}" alt=""></div>
      <div class="photo-meta"><span>${index + 1}. ${escapeHtml(sceneLabel(photo.category))}</span><span>${escapeHtml(photo.fileName)}</span></div>
      <div class="confidence-row"><span>${confidence}% confidence</span><b>${confidence >= 78 ? "Strong match" : "Review suggested"}</b></div>
      ${suggestions.length ? `<div class="suggestion-row"><span>Suggested:</span>${suggestions.map((suggestion) => `<button data-suggest-photo="${photo.id}" data-suggest-category="${escapeAttr(suggestion)}">${escapeHtml(suggestion)}</button>`).join("")}</div>` : ""}
      <label class="photo-type-select">
        <span>Scene type</span>
        <select data-photo-type="${photo.id}">
          ${sceneTypes.map((type) => `<option value="${type}" ${sceneLabel(photo.category) === type ? "selected" : ""}>${type}</option>`).join("")}
        </select>
      </label>
      <div class="photo-controls">
        <button data-move="${photo.id}" data-dir="-1">Up</button>
        <button data-move="${photo.id}" data-dir="1">Down</button>
        <button data-remove="${photo.id}">Remove</button>
      </div>
    </article>
  `;
}

async function handlePhotoFiles(event) {
  await processSelectedFiles([...event.target.files]);
  event.target.value = "";
}

async function processSelectedFiles(selectedFiles) {
  const imageFiles = selectedFiles.filter((file) => file.type.startsWith("image/"));
  const rejectedCount = selectedFiles.length - imageFiles.length;
  if (rejectedCount) {
    showToast(`${rejectedCount} non-image file${rejectedCount === 1 ? "" : "s"} skipped`, "error");
  }
  if (!imageFiles.length) {
    setError("No image files were selected. Upload JPG, PNG, or WebP photos.");
    return;
  }
  const currentPhotos = orderedPhotos();
  const existingKeys = new Set(currentPhotos.map(photoDuplicateKey));
  const uniqueFiles = [];
  let duplicateCount = 0;
  imageFiles.forEach((file) => {
    const key = fileDuplicateKey(file);
    if (existingKeys.has(key)) {
      duplicateCount += 1;
      return;
    }
    existingKeys.add(key);
    uniqueFiles.push(file);
  });
  if (duplicateCount) {
    showToast(`${duplicateCount} duplicate photo${duplicateCount === 1 ? "" : "s"} skipped`, "error");
  }
  if (!uniqueFiles.length) {
    setError("Those photos are already in this project.");
    return;
  }
  setState({ loading: featureFlags.MOCK_SUPABASE ? "Preparing uploaded photos..." : "Uploading photos to Supabase Storage...", error: "" });
  try {
    const remoteProjectId = shouldUseLocalPersistence() ? "" : await ensureRemoteProjectForUploads();
    const uploadedAssets = await Promise.all(uniqueFiles.map((file, index) => prepareProjectPhoto(file, index, remoteProjectId)));
    const uploadedPhotos = uniqueFiles.map((file, index) => {
      const classification = classifyPhoto(file.name, currentPhotos.length + index);
      const publicUrl = uploadedAssets[index].publicUrl;
      return {
        id: `local-${Date.now()}-${index}`,
        uri: publicUrl,
        publicUrl,
        public_url: publicUrl,
        storagePath: uploadedAssets[index].path,
        fileName: file.name,
        size: file.size,
        category: classification.category,
        confidence: classification.confidence,
        suggestedCorrections: classification.suggestedCorrections,
        order: currentPhotos.length + index + 1
      };
    });
    setState((current) => {
      const existing = [...current.project.photos].sort((a, b) => a.order - b.order);
      const photos = [...existing, ...uploadedPhotos].map((photo, index) => ({ ...photo, order: index + 1 }));
      return { ...current, loading: "", error: "", project: { ...current.project, photos } };
    });
    const total = currentPhotos.length + uploadedPhotos.length;
    showToast(`${total} photo${total === 1 ? "" : "s"} uploaded`);
  } catch (error) {
    setError(error.message || "Photo upload failed. Try smaller image files.");
  }
}

async function ensureRemoteProjectForUploads() {
  if (!authUser) throw new Error("Sign in before uploading photos to Supabase Storage.");
  const ids = await window.EstateMotionSupabase.saveWorkspace(state, authUser);
  if (ids.projectId && state.project.id !== ids.projectId) {
    state = { ...state, project: { ...state.project, id: ids.projectId } };
  }
  if (ids.brandKitId && state.brandKit.id !== ids.brandKitId) {
    state = { ...state, brandKit: { ...state.brandKit, id: ids.brandKitId } };
  }
  return ids.projectId || state.project.id;
}

async function prepareProjectPhoto(file, index, remoteProjectId = "") {
  if (shouldUseLocalPersistence()) {
    const publicUrl = await readFileAsDataUrl(file);
    return { publicUrl, path: "" };
  }
  if (!authUser) throw new Error("Sign in before uploading photos to Supabase Storage.");
  const projectId = remoteProjectId || state.project.id || "draft";
  const path = `${authUser.id}/projects/${projectId}/${Date.now()}-${index}-${file.name}`;
  return window.EstateMotionSupabase.uploadAsset(file, window.EstateMotionSupabase.buckets.projectPhotos, path);
}

function fileDuplicateKey(file) {
  return `${file.name.toLowerCase()}::${file.size}`;
}

function photoDuplicateKey(photo) {
  return `${String(photo.fileName ?? "").toLowerCase()}::${photo.size ?? 0}`;
}

function bindUploadDropZone() {
  const zone = document.querySelector("[data-upload-zone]");
  zone.addEventListener("dragenter", (event) => {
    event.preventDefault();
    zone.classList.add("drag-over");
  });
  zone.addEventListener("dragover", (event) => {
    event.preventDefault();
    zone.classList.add("drag-over");
  });
  zone.addEventListener("dragleave", () => zone.classList.remove("drag-over"));
  zone.addEventListener("drop", (event) => {
    event.preventDefault();
    zone.classList.remove("drag-over");
    processSelectedFiles([...event.dataTransfer.files]);
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function bindBrandUploads() {
  document.querySelectorAll("[data-brand-upload]").forEach((input) => {
    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        setError("Brand assets must be image files.");
        return;
      }
      const type = input.dataset.brandUpload;
      setState({ loading: shouldUseLocalPersistence() ? "Preparing brand asset..." : "Uploading brand asset...", error: "" });
      try {
        const asset = shouldUseLocalPersistence()
          ? { publicUrl: await readFileAsDataUrl(file), path: "" }
          : await window.EstateMotionSupabase.uploadAsset(file, window.EstateMotionSupabase.buckets.brandAssets, `${authUser.id}/brand/${Date.now()}-${type}-${file.name}`);
        setState((current) => ({
          ...current,
          loading: "",
          brandKit: {
            ...current.brandKit,
            [type === "headshot" ? "headshotUri" : "logoUri"]: asset.publicUrl,
            [type === "headshot" ? "headshotPath" : "logoPath"]: asset.path
          }
        }));
        showToast(`${type === "headshot" ? "Headshot" : "Logo"} uploaded`);
      } catch (error) {
        setError(error.message || "Brand asset upload failed.");
      } finally {
        input.value = "";
      }
    });
  });
}

function bindPhotoControls() {
  bindPhotoDragReorder();
  document.querySelectorAll("[data-photo-type]").forEach((select) => {
    select.addEventListener("change", () => updatePhotoType(select.dataset.photoType, select.value));
  });
  document.querySelectorAll("[data-move]").forEach((button) => {
    button.addEventListener("click", () => movePhoto(button.dataset.move, Number(button.dataset.dir)));
  });
  document.querySelectorAll("[data-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      const photos = orderedPhotos().filter((photo) => photo.id !== button.dataset.remove).map((photo, index) => ({ ...photo, order: index + 1 }));
      setState((current) => ({ ...current, project: { ...current.project, photos } }));
    });
  });
  document.querySelectorAll("[data-suggest-photo]").forEach((button) => {
    button.addEventListener("click", () => updatePhotoType(button.dataset.suggestPhoto, button.dataset.suggestCategory));
  });
}

function updatePhotoType(id, category) {
  const photos = orderedPhotos().map((photo) => photo.id === id ? { ...photo, category, confidence: 100, suggestedCorrections: [] } : photo);
  setState((current) => ({ ...current, project: { ...current.project, photos } }));
  showToast("Photo scene type updated");
}

function bindPhotoDragReorder() {
  document.querySelectorAll("[data-photo-id]").forEach((card) => {
    card.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", card.dataset.photoId);
      card.classList.add("dragging");
    });
    card.addEventListener("dragend", () => card.classList.remove("dragging"));
    card.addEventListener("dragover", (event) => {
      event.preventDefault();
      card.classList.add("drop-target");
    });
    card.addEventListener("dragleave", () => card.classList.remove("drop-target"));
    card.addEventListener("drop", (event) => {
      event.preventDefault();
      card.classList.remove("drop-target");
      const draggedId = event.dataTransfer.getData("text/plain");
      reorderPhotoBefore(draggedId, card.dataset.photoId);
    });
  });
}

function reorderPhotoBefore(draggedId, targetId) {
  if (!draggedId || !targetId || draggedId === targetId) return;
  const photos = orderedPhotos();
  const dragged = photos.find((photo) => photo.id === draggedId);
  if (!dragged) return;
  const remaining = photos.filter((photo) => photo.id !== draggedId);
  const targetIndex = remaining.findIndex((photo) => photo.id === targetId);
  remaining.splice(targetIndex, 0, dragged);
  setState((current) => ({ ...current, project: { ...current.project, photos: remaining.map((photo, order) => ({ ...photo, order: order + 1 })) } }));
  showToast("Photo order updated");
}

function movePhoto(id, direction) {
  const photos = orderedPhotos();
  const index = photos.findIndex((photo) => photo.id === id);
  const target = index + direction;
  if (target < 0 || target >= photos.length) return;
  [photos[index], photos[target]] = [photos[target], photos[index]];
  setState((current) => ({ ...current, project: { ...current.project, photos: photos.map((photo, order) => ({ ...photo, order: order + 1 })) } }));
}

function sortPhotos() {
  const photos = [...state.project.photos].sort((a, b) => flowRank(sceneLabel(a.category)) - flowRank(sceneLabel(b.category)) || sceneConfidence(b) - sceneConfidence(a) || a.order - b.order).map((photo, index) => ({ ...photo, order: index + 1 }));
  setState((current) => ({ ...current, project: { ...current.project, photos } }));
  showToast("Photos sorted for a real estate reel");
}

function applyFeaturedPropertyFlow() {
  const used = new Set();
  const photos = orderedPhotos();
  const ordered = [];
  featuredPropertyFlow.forEach((type) => {
    const match = photos.find((photo) => !used.has(photo.id) && sceneLabel(photo.category) === type);
    if (match) {
      used.add(match.id);
      ordered.push(match);
    }
  });
  photos.forEach((photo) => {
    if (!used.has(photo.id)) ordered.push(photo);
  });
  setState((current) => ({ ...current, project: { ...current.project, photos: ordered.map((photo, order) => ({ ...photo, order: order + 1 })) } }));
  showToast("Best Listing Flow applied");
}

function oneClickReel() {
  const photoError = validatePhotos();
  if (photoError) {
    setError("Upload at least 3 listing photos before using One-Click Reel.");
    navigate("upload");
    return;
  }

  const ordered = [...state.project.photos]
    .sort((a, b) => flowRank(sceneLabel(a.category)) - flowRank(sceneLabel(b.category)) || sceneConfidence(b) - sceneConfidence(a) || a.order - b.order)
    .map((photo, index) => ({ ...photo, order: index + 1 }));
  const city = state.project.city || "your market";
  const templateId = state.project.listingType === "Open House"
    ? "open-house"
    : state.project.captionTone === "Viral"
      ? "viral-fast-cut"
      : state.project.localAgentMode && /scottsdale/i.test(city)
        ? "desert-luxury"
        : "modern-luxury";
  const template = templates.find((item) => item.id === templateId) ?? templates[0];
  const preset = state.project.listingType === "Open House" ? "Open House" : templateId === "viral-fast-cut" ? "Just Listed" : templateId === "desert-luxury" ? "Scottsdale Luxury" : "Luxury";
  const hook = hydratePreset(hookPresets[preset] || hookPresets.Luxury);

  setState((current) => ({
    ...current,
    selectedTemplateId: template.id,
    selectedScene: 0,
    screen: "preview",
    error: "",
    project: {
      ...current.project,
      photos: ordered,
      hookPreset: preset,
      hookText: hook,
      cta: current.project.cta || template.ctaWording,
      thumbnailPreset: templateId === "viral-fast-cut" ? "Inside This Home" : current.project.thumbnailPreset,
      reelTheme: templateId === "desert-luxury" ? "scottsdale-desert-luxury" : templateId === "open-house" ? "open-house-fast-cut" : current.project.reelTheme,
      reelVariations: createReelVariations()
    }
  }));
  trackEvent("one_click_reel", { templateId: template.id, photos: ordered.length });
  showToast("One-Click Reel prepared");
}

function flowRank(category) {
  const normalized = sceneLabel(category);
  const index = featuredPropertyFlow.findIndex((item) => sceneLabel(item) === normalized || item === normalized);
  return index === -1 ? 999 : index;
}

function renderDetails() {
  const copy = aiCopy();
  renderLayout(`
    <div class="screen-title"><p class="eyebrow">Pro Controls</p><h2>Fine-tune the story.</h2><p>Optional controls for agents who want to tune copy, facts, and feature cards before preview.</p></div>
    <section class="panel">
      <details class="advanced-panel" open>
        <summary>Advanced copy and listing facts</summary>
        <div class="grid-2">${field("Beds", "beds")}${field("Baths", "baths")}</div>
        ${field("Square footage", "squareFeet")}
        <div class="preset-block">
          <strong>Hook presets</strong>
          <div class="preset-row">${Object.keys(hookPresets).map((preset) => `<button class="ghost" data-hook-preset="${preset}">${preset}</button>`).join("")}</div>
        </div>
        ${field("Hook text", "hookText")}
        <div class="grid-2">
          ${field("Caption tone", "captionTone", { choices: Object.keys(captionTonePresets) })}
          ${field("Social CTA", "cta", { choices: ctaPresets })}
        </div>
        ${field("Caption", "caption", { type: "textarea" })}
      </details>
      <section class="spotlight-card">
        <div><span>Address</span><strong>${escapeHtml(state.project.address)}</strong></div>
        <div><span>Area</span><strong>${escapeHtml(state.project.neighborhood || state.project.city)}</strong></div>
        <div><span>Beds/Baths</span><strong>${state.project.beds} / ${state.project.baths}</strong></div>
        <div><span>Square footage</span><strong>${escapeHtml(state.project.squareFeet)}</strong></div>
        <div><span>Price</span><strong>${escapeHtml(state.project.price)}</strong></div>
      </section>
      <div class="feature-cards">
        ${topFeatures().map((item, index) => `<div><strong>Top feature ${index + 1}</strong><br>${escapeHtml(item)}</div>`).join("")}
      </div>
      <button class="primary" data-next="template">Choose style</button>
    </section>
  `);
  document.querySelectorAll("[data-hook-preset]").forEach((button) => {
    button.addEventListener("click", () => applyHookPreset(button.dataset.hookPreset));
  });
  document.querySelector("[data-next]").addEventListener("click", () => guard(validateProjectBasics() || validatePhotos(), () => {
    showToast("AI copy refreshed");
    navigate("template");
  }));
}

function renderTemplate() {
  renderLayout(`
    <div class="screen-title cinematic-title"><p class="eyebrow">Choose video style</p><h2>Pick the feel of the reel.</h2><p>Each style changes the pacing, overlays, motion system, CTA, and export manifest while keeping the listing photography real.</p></div>
    <section class="panel">
      <div class="template-showcase">
        ${templates.map((template) => templateChoiceCard(template)).join("")}
      </div>
      ${!templates.length ? emptyState("No templates available", "Check template configuration before previewing.") : ""}
    </section>
    <details class="advanced-panel">
      <summary>Pro Controls: brand theme, animation, music, thumbnail</summary>
      <section class="panel">
        <div class="section-title"><p>Branded reel themes</p><h3>Agent-grade visual systems</h3></div>
        <div class="theme-grid">
          ${reelThemes.map((theme) => `<button class="theme-card ${state.project.reelTheme === theme.id ? "selected" : ""}" data-reel-theme="${theme.id}" style="--theme-accent:${theme.accent};--theme-bg:${theme.background}"><span></span><strong>${theme.name}</strong><small>${theme.description}</small></button>`).join("")}
        </div>
        <div class="grid-2">
          ${field("Text animation", "textAnimation", { choices: textAnimationStyles })}
          ${field("Music mood", "musicMood", { choices: musicMoods })}
        </div>
        <div class="grid-2">
          ${field("Outro variation", "outroVariation", { choices: outroVariations })}
          ${field("Thumbnail", "thumbnailPreset", { choices: thumbnailPresets })}
        </div>
        <button class="secondary" data-generate-variations>Generate 3 Reel Variations</button>
      </section>
    </details>
    <div class="actions">
      <button class="secondary" data-one-click>One-Click Reel</button>
      <button class="primary" data-next="preview">Review preview</button>
    </div>
  `);
  document.querySelectorAll("[data-reel-theme]").forEach((button) => {
    button.addEventListener("click", () => updateProject("reelTheme", button.dataset.reelTheme));
  });
  document.querySelector("[data-generate-variations]")?.addEventListener("click", generateReelVariations);
  document.querySelectorAll("[data-template]").forEach((button) => button.addEventListener("click", () => {
    trackEvent("template_select", { templateId: button.dataset.template });
    setState({ selectedTemplateId: button.dataset.template });
  }));
  document.querySelector("[data-one-click]").addEventListener("click", oneClickReel);
  document.querySelector("[data-next]").addEventListener("click", () => guard(validateProjectBasics() || validatePhotos() || validateTemplate(), () => navigate("preview")));
}

function templateChoiceCard(template) {
  return `
    <button class="template-card template-premium-card ${template.id === normalizeTemplateId(state.selectedTemplateId) ? "selected" : ""}" data-template="${template.id}" style="--template-accent:${template.accentColor}">
      <span class="template-preview">
        <span></span><b></b><i></i>
      </span>
      <span class="template-copy">
        <em>${escapeHtml(template.visualCue || "Reel style")}</em>
        <strong>${escapeHtml(template.name)}</strong>
        <small>${escapeHtml(template.description)}</small>
        <small>${template.motionSpeed} motion / ${template.transitionStyle} / ${template.textPlacement} text</small>
      </span>
    </button>
  `;
}

function renderPreview() {
  const photos = orderedPhotos();
  const photo = photos[state.selectedScene] ?? photos[0] ?? demoPhotos[0];
  const copy = aiCopy();
  const template = selectedTemplate();
  const theme = selectedReelTheme();
  const currentSceneLabel = sceneBeatLabel(photo, state.selectedScene, photos.length);
  const pacing = reelPacing(photos);
  const currentPlan = pacing[state.selectedScene] ?? motionPlanForPhoto(photo, state.selectedScene);
  renderLayout(`
    <div class="screen-title cinematic-title"><p class="eyebrow">${template.name}</p><h2>Review the finished reel.</h2><p>Large vertical preview, scene pacing, text overlays, brand end card, and export readiness in one place.</p></div>
    ${photos.length ? `<section class="preview-suite">
      <div class="video-player-shell">
        <div class="player-chrome"><span>9:16 Reel Preview</span><b>${escapeHtml(template.name)}</b></div>
        ${reelStage(photo, copy, template, state.selectedScene, photos.length)}
      </div>
      <aside class="preview-inspector panel export-status-card">
        <div class="section-title"><p>Export readiness</p><h3>${state.exportResult ? "Rendered asset ready" : "Ready to render"}</h3></div>
        <p class="muted">${escapeHtml(photo.fileName)} plays as a ${currentPlan.duration}s ${currentPlan.motionStyle} beat. Depth simulation preserves property integrity with no hallucinated rooms.</p>
        <div class="metric-row"><span>Current scene</span><b>${escapeHtml(sceneLabel(photo.category))}</b></div>
        <div class="metric-row"><span>Motion label</span><b>${escapeHtml(currentPlan.motionStyle)}</b></div>
        <div class="metric-row"><span>Beat sync</span><b>${escapeHtml(currentPlan.beatMarker)}</b></div>
        <div class="metric-row"><span>Text overlay</span><b>${escapeHtml(state.project.textAnimation)}</b></div>
        <div class="metric-row"><span>Brand end card</span><b>${state.project.brandingVisible ? "Included" : "Hidden"}</b></div>
        <div class="metric-row"><span>Formats</span><b>9:16 / 16:9 / 1:1</b></div>
        <div class="metric-row"><span>Queue</span><b>${state.renderQueue.length ? state.renderQueue[0].status : "not queued"}</b></div>
      </aside>
    </section>` : emptyState("Preview needs photos", "Upload at least 3 listing photos to preview the reel.")}
    <div class="actions">
      <button class="secondary" data-scene="-1">Previous scene</button>
      <button class="secondary" data-scene="1">Next scene</button>
      <button class="ghost" data-edit>Pro Controls</button>
      <button class="primary" data-next="export">Export reel</button>
    </div>
    <section class="panel scene-card-panel">
      <div class="section-title"><p>Real reel timeline</p><h3>${photos.length} scenes / ${beatSyncPlan(renderManifestScenes()).totalDuration}s</h3></div>
      <div class="scene-card-grid">
        ${photos.length ? photos.map((item, index) => sceneCard(item, index, pacing[index])).join("") : emptyState("No sequence yet", "Photos appear here after upload.")}
      </div>
    </section>
    <section class="panel">
      <div class="section-title"><p>Neighborhood spotlight</p><h3>${escapeHtml(state.project.thumbnailPreset)}</h3></div>
      <section class="spotlight-card">
        <div><span>Address</span><strong>${escapeHtml(state.project.address)}</strong></div>
        <div><span>Area</span><strong>${escapeHtml(state.project.neighborhood || state.project.city)}</strong></div>
        <div><span>Beds/Baths</span><strong>${state.project.beds} / ${state.project.baths}</strong></div>
        <div><span>Square footage</span><strong>${escapeHtml(state.project.squareFeet)}</strong></div>
        <div><span>Price</span><strong>${escapeHtml(state.project.price)}</strong></div>
      </section>
    </section>
    <section class="panel">
      <div class="section-title"><p>Top 3 Features</p><h3>Auto card</h3></div>
      <div class="feature-cards">${topFeatures().map((item, index) => `<div><strong>${index + 1}</strong><br>${escapeHtml(item)}</div>`).join("")}</div>
    </section>
    <section class="panel brand-end-preview">
      <div class="section-title"><p>Brand end card</p><h3>${escapeHtml(state.brandKit.name)} / ${escapeHtml(state.brandKit.brokerage)}</h3></div>
      ${agentStrip()}
    </section>
    ${state.project.reelVariations?.length ? `<section class="panel"><div class="section-title"><p>Generated variations</p><h3>3 reel directions</h3></div><div class="variation-grid">${state.project.reelVariations.map((variation) => `<article><strong>${variation.name}</strong><span>${escapeHtml(variation.settings.textAnimation)} / ${escapeHtml(variation.settings.musicMood)}</span></article>`).join("")}</div></section>` : ""}
    <details class="advanced-panel">
      <summary>Pro Controls: copy, compliance, and full timeline</summary>
      <section class="panel">
      <div class="section-title"><p>Feature cards</p><h3>AI-style highlights</h3></div>
      <div class="feature-cards">${copy.highlights.map((item) => `<div>${escapeHtml(item)}</div>`).join("")}</div>
      </section>
      <section class="panel compliance-preview">
        <div class="section-title"><p>Compliance</p><h3>${state.brandKit.complianceEnabled ? "Included" : "Hidden"}</h3></div>
        ${complianceBlock()}
      </section>
    </details>
  `);
  document.querySelectorAll("[data-scene]").forEach((button) => {
    button.addEventListener("click", () => {
      const next = Math.max(0, Math.min(photos.length - 1, state.selectedScene + Number(button.dataset.scene)));
      setState({ selectedScene: next });
    });
  });
  document.querySelectorAll("[data-jump]").forEach((button) => button.addEventListener("click", () => setState({ selectedScene: Number(button.dataset.jump) })));
  document.querySelector("[data-edit]").addEventListener("click", () => navigate("edit"));
  document.querySelector("[data-next]").addEventListener("click", () => guard(validateProjectBasics() || validatePhotos() || validateTemplate(), () => navigate("export")));
}

function sceneCard(item, index, pacing) {
  return `
    <button class="scene-card ${state.selectedScene === index ? "active" : ""}" data-jump="${index}">
      <img src="${item.uri}" alt="">
      <span>${String(index + 1).padStart(2, "0")}</span>
      <strong>${escapeHtml(sceneLabel(item.category))}</strong>
      <small>${escapeHtml(pacing?.motionStyle || "Push-in")} / ${pacing?.duration || "2.0"}s</small>
    </button>
  `;
}

function reelStage(photo, copy, template, index = 0, total = 1) {
  const beat = sceneBeatLabel(photo, index, total);
  const pacing = reelPacing(orderedPhotos())[index] ?? { move: "push-in", duration: "2.0" };
  const theme = selectedReelTheme();
  return `
    <section class="reel-stage reel-${slug(pacing.move)} text-${slug(state.project.textAnimation)}" style="border-color:${theme.accent};--reel-accent:${theme.accent};--reel-bg:${theme.background}">
      <img src="${photo.uri}" alt="">
      <div class="reel-overlay">
        <div class="intro-card">
          <span class="badge">${beat}</span>
          <span>${escapeHtml(state.project.city)} / ${escapeHtml(state.project.neighborhood)}</span>
        </div>
        <div class="thumbnail-card">${escapeHtml(state.project.thumbnailPreset)}</div>
        <div class="reel-hook">
          <h3>${escapeHtml(copy.hook)}</h3>
          <p>${state.project.price} - ${state.project.beds} BD - ${state.project.baths} BA - ${state.project.squareFeet} SQ FT</p>
        </div>
        <div class="reel-progress">${Array.from({ length: total }, (_, dotIndex) => `<span class="${dotIndex <= index ? "active" : ""}"></span>`).join("")}</div>
        ${state.project.brandingVisible ? outroBlock() : ""}
        ${state.brandKit.complianceEnabled ? `<small class="reel-disclaimer">${escapeHtml(state.brandKit.listingCourtesyOf)}</small>` : ""}
      </div>
    </section>
  `;
}

function sceneBeatLabel(photo, index, total) {
  if (index === 0) return "Exterior hero";
  if (index === total - 1) return "Final reason to tour";
  return sceneLabel(photo?.category ?? "Detail shots");
}

function reelPacing(photos) {
  return photos.map((photo, index) => motionPlanForPhoto(photo, index));
}

function selectedMotionSystem() {
  if (state.project.captionTone === "Viral") return motionSystems.Viral;
  if (state.project.captionTone === "Investor" || state.project.reelTheme === "investor-cash-flow") return motionSystems.Investor;
  if (state.project.listingType === "Open House" || state.project.reelTheme === "open-house-fast-cut") return motionSystems["Open House"];
  if (state.project.captionTone === "First-time buyer" || state.project.reelTheme === "first-time-buyer-friendly") return motionSystems["First-time buyer"];
  return motionSystems.Luxury;
}

function motionPlanForPhoto(photo, index = 0) {
  const category = sceneLabel(photo?.category ?? "Detail shots");
  const system = selectedMotionSystem();
  const intelligence = sceneIntelligence[category] ?? sceneIntelligence["Detail shots"];
  const motionStyle = index === 0 ? "Depth zoom" : intelligence.suggestedMotion || system.defaultMotion;
  const duration = Math.max(1.05, system.baseDuration + sceneDurationAdjustment(category, index)).toFixed(2);
  const beatIndex = index + 1;
  return {
    sceneId: photo?.id,
    sceneType: category,
    confidence: sceneConfidence(photo ?? { fileName: "", order: index + 1 }),
    motionStyle,
    move: motionToClass(motionStyle),
    duration,
    transition: system.transition,
    beatMarker: `Beat ${beatIndex}${beatIndex % system.beatEvery === 0 ? " / transition accent" : ""}`,
    musicPacing: system.tempo,
    depthModel: ["Exterior hero", "Backyard / pool", "Living room"].includes(category) ? "layered parallax" : "subtle monocular depth",
    realismGuardrail: "Preserve exact property geometry; no hallucinated rooms, windows, furniture, or warped architecture.",
    overlayText: intelligence.overlay
  };
}

function sceneDurationAdjustment(category, index) {
  if (index === 0) return 0.35;
  if (["Kitchen", "Living room", "Backyard / pool"].includes(category)) return 0.18;
  if (["Detail shots", "Bathroom"].includes(category)) return -0.25;
  return 0;
}

function motionToClass(motionStyle) {
  const map = {
    "Push-in": "push-in",
    "Pull-out": "pull-out",
    "Slow pan": "slow-pan",
    "Depth zoom": "depth-zoom",
    "Orbit simulation": "orbit-simulation",
    "Vertical social framing": "vertical-social-framing"
  };
  return map[motionStyle] ?? "push-in";
}

function renderEdit() {
  const copy = aiCopy();
  renderLayout(`
    <div class="screen-title"><p class="eyebrow">Edit</p><h2>Reel Copy & Order</h2><p>Change hook, CTA, caption, template, branding visibility, and photo order before export.</p></div>
    <section class="panel">
      <div class="preset-block">
        <strong>Hook presets</strong>
        <div class="preset-row">${Object.keys(hookPresets).map((preset) => `<button class="ghost" data-hook-preset="${preset}">${preset}</button>`).join("")}</div>
      </div>
      ${field("Hook", "hookText")}
      <div class="grid-2">
        ${field("Caption tone", "captionTone", { choices: Object.keys(captionTonePresets) })}
        ${field("Social CTA", "cta", { choices: ctaPresets })}
      </div>
      ${field("Caption", "caption", { type: "textarea" })}
      ${field("Template", "unusedTemplate", { choices: templates.map((template) => template.name) }).replace('data-project="unusedTemplate"', 'data-template-select')}
      <label class="field"><span>Branding visibility</span><select data-branding-visible><option value="true" ${state.project.brandingVisible ? "selected" : ""}>Visible</option><option value="false" ${!state.project.brandingVisible ? "selected" : ""}>Hidden</option></select></label>
      <div class="feature-cards"><div><strong>Instagram caption</strong><br>${escapeHtml(copy.instagramCaption).replaceAll("\n", "<br>")}</div><div><strong>Hashtags</strong><br>${copy.hashtags.join(" ")}</div><div><strong>Voiceover</strong><br>${escapeHtml(copy.voiceoverScript)}</div></div>
      <button class="primary" data-next="export">Export</button>
    </section>
    <section class="photo-grid">${orderedPhotos().length ? orderedPhotos().map((photo, index) => photoCard(photo, index)).join("") : emptyState("No editable photos", "Upload photos before editing scene order.")}</section>
  `);
  document.querySelectorAll("[data-hook-preset]").forEach((button) => {
    button.addEventListener("click", () => applyHookPreset(button.dataset.hookPreset));
  });
  document.querySelector("[data-next]").addEventListener("click", () => guard(validateProjectBasics() || validatePhotos() || validateTemplate(), () => navigate("export")));
  const templateSelect = document.querySelector("[data-template-select]");
  templateSelect.value = selectedTemplate().name;
  templateSelect.addEventListener("input", () => {
    const template = templates.find((item) => item.name === templateSelect.value);
    if (template) setState({ selectedTemplateId: template.id });
  });
  document.querySelector("[data-branding-visible]").addEventListener("input", (event) => updateProject("brandingVisible", event.target.value === "true"));
  bindPhotoControls();
}

function renderBrand() {
  renderLayout(`
    <div class="screen-title"><p class="eyebrow">Brand Kit</p><h2>Agent Branding</h2><p>This feeds onboarding, personal brand end cards, social captions, and compliance footers.</p></div>
    <section class="panel elevated">
      <div class="grid-2">${brandField("Name", "name")}${brandField("Brokerage", "brokerage")}</div>
      <div class="grid-2">${brandField("Headshot URL", "headshotUri")}${brandField("Logo URL", "logoUri")}</div>
      <div class="grid-2">
        <div class="field"><label>Upload headshot</label><input type="file" accept="image/*" data-brand-upload="headshot"></div>
        <div class="field"><label>Upload logo</label><input type="file" accept="image/*" data-brand-upload="logo"></div>
      </div>
      <div class="grid-2">${brandField("Phone", "phone")}${brandField("Email", "email")}</div>
      ${brandField("Website", "website")}
      ${brandField("Instagram", "instagram")}
      <div class="grid-2">${brandField("Primary color", "primaryColor")}${brandField("Accent color", "accentColor")}</div>
      ${brandField("CTA text", "ctaText")}
    </section>
    <section class="panel">
      <div class="section-title"><p>Compliance mode</p><h3>Disclaimers</h3></div>
      ${brandToggle("Enable compliance fields", "complianceEnabled")}
      ${brandToggle("Equal Housing Opportunity", "equalHousing")}
      ${brandTextarea("Listing courtesy of", "listingCourtesyOf")}
      ${brandTextarea("Brokerage disclaimer", "brokerageDisclaimer")}
      ${brandTextarea("MLS disclaimer placeholder", "mlsDisclaimer")}
      ${complianceBlock()}
      <button class="primary" data-save-brand>Save brand kit</button>
    </section>
  `);
  document.querySelector("[data-save-brand]").addEventListener("click", () => guard(validateBrandKit(), () => showToast("Brand kit saved")));
  bindBrandUploads();
}

function renderExport() {
  const copy = aiCopy();
  const template = selectedTemplate();
  const pack = contentPack();
  const result = buildExportPayload();
  const mp4Ready = !featureFlags.MOCK_RENDERING;
  const renderUrl = state.exportResult?.mp4Url || state.exportResult?.output || "";
  const exportOptions = [
    ["Branded MP4", "Agent end card + CTA", "9:16"],
    ["Unbranded MP4", "MLS-safe version", "16:9"],
    ["9:16 Reel", "Instagram / TikTok / Shorts", "1080x1920"],
    ["16:9 YouTube/Web", "Website and YouTube", "1920x1080"],
    ["Caption", "AI-written Instagram copy", "Text"],
    ["Hashtags", "Local discovery set", "Text"],
    ["Thumbnail", state.project.thumbnailPreset, "PNG"],
    ["Content Pack", `${pack.length} launch assets`, "Bundle"]
  ];
  renderLayout(`
    <div class="screen-title cinematic-title"><p class="eyebrow">Export</p><h2>Leave with social-ready assets.</h2><p>${featureFlags.MOCK_RENDERING ? "Mock rendering is enabled. Queue states are real locally; MP4 output falls back to JSON and preview HTML." : "Live rendering is enabled. EstateMotion will call the render worker for MP4 jobs."}</p></div>
    <section class="panel elevated export-command">
      <div class="section-title"><p>Final output</p><h3>${state.exportResult ? "Render ready" : "Ready to create"}</h3></div>
      <div class="export-option-grid">${exportOptions.map(([title, body, format]) => exportOptionCard(title, body, format)).join("")}</div>
      <div class="actions">
        <button class="primary" data-queue-pack>${mp4Ready ? "Create MP4 exports" : "Create mock export pack"}</button>
        <button class="secondary" data-download-json>Download JSON manifest</button>
        <button class="secondary" data-download-html>Download preview HTML</button>
        <button class="ghost" data-download-copy>Download caption + hashtags</button>
      </div>
    </section>
    ${renderQueuePanel()}
    <section class="panel elevated">
      <div class="section-title"><p>Content Pack</p><h3>${pack.length} deliverables</h3></div>
      <div class="pack-grid">${pack.map((item) => contentPackCard(item)).join("")}</div>
    </section>
    <section class="panel share-panel">
      <div class="section-title"><p>Share & downloads</p><h3>Agent handoff assets</h3></div>
      <div class="actions">
        <button class="secondary" data-download-html>Download reel preview HTML</button>
        <button class="secondary" data-download-json>Download content pack manifest</button>
        <button class="ghost" data-copy-caption>Copy Instagram caption</button>
        <button class="ghost" data-copy-hashtags>Copy hashtags</button>
      </div>
    </section>
    <section class="panel">
      <div class="section-title"><p>${template.name}</p><h3>Caption assets</h3></div>
      <div class="feature-cards">
        <div><strong>Caption</strong><br>${escapeHtml(copy.instagramCaption).replaceAll("\n", "<br>")}</div>
        <div><strong>Hashtags</strong><br>${copy.hashtags.join(" ")}</div>
        <div><strong>MP4 status</strong><br>${state.exportResult ? `Ready: ${state.exportResult.createdAt}${renderUrl ? `<br><a href="${escapeHtml(renderUrl)}" target="_blank" rel="noreferrer">Open rendered MP4</a>` : ""}` : "Ready to export"}</div>
      </div>
    </section>
  `);
  document.querySelector("[data-queue-pack]").addEventListener("click", queueContentPack);
  document.querySelectorAll("[data-download-json]").forEach((button) => button.addEventListener("click", () => {
    trackEvent("export_manifest_click", { screen: "export" });
    downloadFile(`${slug(state.project.title)}-render-manifest.json`, "application/json", JSON.stringify(result, null, 2));
    showToast("Content pack manifest downloaded");
  }));
  document.querySelectorAll("[data-download-html]").forEach((button) => button.addEventListener("click", () => {
    trackEvent("export_preview_click", { screen: "export" });
    downloadFile(`${slug(state.project.title)}-preview.html`, "text/html", buildPreviewHtml(result));
    showToast("Preview HTML downloaded");
  }));
  document.querySelector("[data-download-copy]").addEventListener("click", () => {
    trackEvent("export_copy_click", { type: "caption_hashtags_file" });
    downloadFile(`${slug(state.project.title)}-caption-hashtags.txt`, "text/plain", `${copy.instagramCaption}\n\n${copy.hashtags.join(" ")}`);
  });
  document.querySelector("[data-copy-caption]").addEventListener("click", () => {
    trackEvent("copy_caption_click", { screen: "export" });
    copyText(copy.instagramCaption, "Instagram caption copied");
  });
  document.querySelector("[data-copy-hashtags]").addEventListener("click", () => {
    trackEvent("copy_hashtags_click", { screen: "export" });
    copyText(copy.hashtags.join(" "), "Hashtags copied");
  });
  if (!state.exportResult && shouldUseLocalPersistence()) {
    setTimeout(() => setState({ exportResult: { createdAt: new Date().toLocaleString(), output: `${slug(state.project.title)}-mock-render` } }), 0);
  }
}

function exportOptionCard(title, body, format) {
  return `<article class="export-option"><span>${escapeHtml(format)}</span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(body)}</small></article>`;
}

function queueContentPack() {
  const validationError = validateProjectBasics() || validatePhotos() || validateTemplate();
  if (validationError) {
    setError(validationError);
    return;
  }
  const now = new Date().toISOString();
  trackEvent("queue_content_pack", { mockRendering: featureFlags.MOCK_RENDERING, exportTypes: contentPack().map((item) => item.id), templateId: state.selectedTemplateId });
  const jobs = contentPack().map((item) => ({
    id: `${item.id}-${Date.now()}`,
    packId: item.id,
    title: item.title,
    status: item.id === "copy" ? "complete" : "queued",
    format: item.format,
    createdAt: now,
    updatedAt: now,
    outputName: `${slug(state.project.title)}-${slug(item.title)}.${item.id === "copy" ? "txt" : "mp4"}`,
    error: ""
  }));
  setState((current) => ({ ...current, loading: "Queueing content pack...", error: "", renderQueue: jobs }));
  showToast("Content pack queued");

  if (!featureFlags.MOCK_RENDERING) {
    startRealRender(jobs);
    return;
  }

  setTimeout(() => {
    setState((current) => ({ ...current, loading: "" }));
    advanceRenderQueue("queued", "rendering");
  }, 700);
  setTimeout(() => {
    advanceRenderQueue("rendering", "complete");
    uploadGeneratedRenderManifest();
    showToast("Render complete", "success");
  }, 1900);
}

async function startRealRender(jobs) {
  const manifest = {
    ...buildExportPayload(),
    renderQueue: jobs
  };
  const liveRenderError = validateLiveRenderPhotoUrls(manifest.orderedPhotos || []);

  if (liveRenderError) {
    const message = liveRenderError;
    setState((current) => ({
      ...current,
      loading: "",
      error: message,
      renderQueue: current.renderQueue.map((job) => job.status === "queued" ? { ...job, status: "failed", error: message, updatedAt: new Date().toISOString() } : job)
    }));
    showToast("Render failed: public image URLs required", "error");
    return;
  }

  try {
    setState((current) => ({
      ...current,
      loading: "Rendering MP4 with EstateMotion render worker...",
      renderQueue: current.renderQueue.map((job) => job.status === "queued" ? { ...job, status: "rendering", updatedAt: new Date().toISOString() } : job)
    }));

    const response = await fetch(renderApiEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ manifest, jobs, requestedFormat: "vertical" })
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok || payload.status === "failed") {
      throw new Error(payload.error || "EstateMotion render worker failed.");
    }

    const mp4Url = payload.mp4Url || payload.localMp4Path || "";
    const thumbnailUrl = payload.thumbnailUrl || payload.localThumbnailPath || "";
    const completedAt = new Date().toLocaleString();

    setState((current) => ({
      ...current,
      loading: "",
      error: payload.storageWarning || "",
      exportResult: {
        createdAt: completedAt,
        output: mp4Url || "Render complete",
        mp4Url,
        thumbnailUrl,
        storagePath: payload.storagePath || "",
        jobId: payload.jobId || ""
      },
      renderQueue: current.renderQueue.map((job) => job.status === "rendering" ? {
        ...job,
        status: "complete",
        updatedAt: new Date().toISOString(),
        outputPath: payload.storagePath || mp4Url,
        downloadUrl: mp4Url
      } : job)
    }));

    uploadGeneratedRenderManifest();
    showToast(payload.storageWarning ? "Render complete; storage upload needs Supabase service key" : "MP4 render complete", payload.storageWarning ? "info" : "success");
  } catch (error) {
    const message = error.message || "EstateMotion render failed.";
    setState((current) => ({
      ...current,
      loading: "",
      error: message,
      renderQueue: current.renderQueue.map((job) => job.status === "rendering" || job.status === "queued" ? {
        ...job,
        status: "failed",
        updatedAt: new Date().toISOString(),
        error: message
      } : job)
    }));
    showToast("Render failed", "error");
  }
}

async function uploadGeneratedRenderManifest() {
  if (shouldUseLocalPersistence()) return;
  try {
    const payload = JSON.stringify(buildExportPayload(), null, 2);
    const asset = await window.EstateMotionSupabase.uploadTextAsset(`${slug(state.project.title)}-render-manifest.json`, payload, "application/json");
    setState((current) => ({
      ...current,
      exportResult: {
        ...(current.exportResult || {}),
        createdAt: new Date().toLocaleString(),
        output: current.exportResult?.mp4Url || asset.publicUrl,
        manifestUrl: asset.publicUrl,
        manifestStoragePath: asset.path,
        storagePath: current.exportResult?.storagePath || asset.path
      },
      renderQueue: current.renderQueue.map((job) => job.status === "complete" ? { ...job, outputPath: asset.path } : job)
    }));
  } catch (error) {
    setError(error.message || "Generated video storage upload failed.");
  }
}

function advanceRenderQueue(from, to) {
  setState((current) => ({
    ...current,
    renderQueue: current.renderQueue.map((job) => {
      if (job.status !== from) return job;
      return {
        ...job,
        status: to,
        updatedAt: new Date().toISOString(),
        error: to === "failed" ? "Render worker failed or is not configured." : ""
      };
    })
  }));
}

function renderQueuePanel() {
  return `
    <section class="panel">
      <div class="section-title"><p>Render queue</p><h3>Queued / rendering / complete / failed</h3></div>
      ${state.renderQueue.length ? state.renderQueue.map((job) => `
        <div class="queue-row">
          <span><strong>${escapeHtml(job.title)}</strong><small>${escapeHtml(job.outputName)}${job.downloadUrl ? ` · <a href="${escapeHtml(job.downloadUrl)}" target="_blank" rel="noreferrer">Download MP4</a>` : ""}${job.error ? ` · ${escapeHtml(job.error)}` : ""}</small></span>
          <b class="${job.status}">${job.status}</b>
        </div>
      `).join("") : `<p class="muted">No jobs yet. Queue the content pack to start rendering.</p>`}
    </section>
  `;
}

function renderApiEndpoint() {
  return featureFlags.RENDER_ENDPOINT || "/api/render";
}

function buildExportPayload() {
  const copy = aiCopy();
  const scenes = renderManifestScenes();
  const orderedManifestPhotos = orderedPhotos().map(renderPhotoForManifest);
  return {
    app: "EstateMotion",
    createdAt: new Date().toISOString(),
    limitation: "Static MVP export. MP4 rendering may be mocked; this manifest is structured for a Remotion/FFmpeg render worker.",
    project: state.project,
    brandKit: state.brandKit,
    compliance: {
      enabled: state.brandKit.complianceEnabled,
      listingCourtesyOf: state.brandKit.listingCourtesyOf,
      brokerageDisclaimer: state.brandKit.brokerageDisclaimer,
      equalHousing: state.brandKit.equalHousing,
      mlsDisclaimer: state.brandKit.mlsDisclaimer
    },
    featureFlags,
    renderQueue: state.renderQueue,
    template: selectedTemplate(),
    reelTheme: selectedReelTheme(),
    formats: [
      { id: "vertical", label: "9:16 Reels/TikTok/Shorts", width: 1080, height: 1920, branded: true },
      { id: "square", label: "1:1 Instagram", width: 1080, height: 1080, branded: true },
      { id: "wide", label: "16:9 YouTube/web", width: 1920, height: 1080, branded: true },
      { id: "mls", label: "MLS-compliant", width: 1920, height: 1080, branded: false }
    ],
    creative: {
      textAnimation: state.project.textAnimation,
      musicMood: state.project.musicMood,
      outroVariation: state.project.outroVariation,
      thumbnailPreset: state.project.thumbnailPreset,
      reelVariations: state.project.reelVariations,
      motionSystem: selectedMotionSystem(),
      beatSync: beatSyncPlan(scenes)
    },
    topFeatures: topFeatures(),
    orderedPhotos: orderedManifestPhotos,
    scenes,
    copy,
    contentPack: contentPack(),
    renderPlan: [
      "Load ordered photos",
      "Add intro hook card",
      `Apply ${selectedTemplate().motionSpeed} Ken Burns pan/zoom`,
      `Apply ${selectedTemplate().transitionStyle} transitions`,
      "Add feature cards and property facts",
      "Add personal brand end card",
      "Export MP4, thumbnail, caption, hashtags"
    ]
  };
}

function renderManifestScenes() {
  const photos = orderedPhotos();
  const copy = aiCopy();
  return photos.map((photo, index) => {
    const motion = motionPlanForPhoto(photo, index);
    const imageUrl = photoRenderUrl(photo);
    const publicUrl = isLocalOnlyPhotoUrl(imageUrl) ? (photo.publicUrl || photo.public_url || "") : imageUrl;
    return {
      order: index + 1,
      photoId: photo.id,
      fileName: photo.fileName,
      imageUrl,
      publicUrl,
      public_url: publicUrl,
      storagePath: photo.storagePath || "",
      sceneType: motion.sceneType,
      confidence: motion.confidence,
      suggestedCorrections: sceneSuggestions(photo),
      duration: Number(motion.duration),
      motionStyle: motion.motionStyle,
      depthModel: motion.depthModel,
      transition: motion.transition,
      beatMarker: motion.beatMarker,
      overlayText: index === 0 ? copy.hook : motion.overlayText,
      featureCard: topFeatures()[index % Math.max(1, topFeatures().length)] || "",
      branding: index === photos.length - 1 ? "Personal brand end card" : "Subtle lower-third safe area",
      cta: index === photos.length - 1 ? state.project.cta : "",
      complianceFooter: state.brandKit.complianceEnabled ? state.brandKit.listingCourtesyOf : "",
      realismGuardrail: motion.realismGuardrail
    };
  });
}

function renderPhotoForManifest(photo) {
  const sourceUrl = photo.publicUrl || photo.public_url || photo.uri || "";
  const publicUrl = isLocalOnlyPhotoUrl(sourceUrl) ? (photo.publicUrl || photo.public_url || "") : sourceUrl;
  const renderUrl = publicUrl || sourceUrl;
  return {
    ...photo,
    uri: renderUrl,
    publicUrl,
    public_url: publicUrl,
    imageUrl: renderUrl
  };
}

function photoRenderUrl(photo) {
  const sourceUrl = photo.publicUrl || photo.public_url || photo.uri || "";
  if (isLocalOnlyPhotoUrl(sourceUrl)) return sourceUrl;
  return sourceUrl;
}

function isLocalOnlyPhotoUrl(url) {
  const value = String(url || "");
  return value.startsWith("blob:") || value.startsWith("data:");
}

function validateLiveRenderPhotoUrls(photos) {
  if (featureFlags.MOCK_RENDERING) return "";
  const localOnly = photos.filter((photo) => isLocalOnlyPhotoUrl(photoRenderUrl(photo)));
  if (!localOnly.length) return "";
  const names = localOnly.slice(0, 3).map((photo) => photo.fileName || photo.id || "unnamed photo").join(", ");
  return `Live MP4 rendering requires Supabase/public image URLs. ${localOnly.length} photo${localOnly.length === 1 ? "" : "s"} still use blob/data URLs${names ? ` (${names})` : ""}. Switch to Supabase mode and re-upload photos, or set MOCK_RENDERING=true for local demo exports.`;
}

function beatSyncPlan(scenes) {
  const totalDuration = scenes.reduce((sum, scene) => sum + Number(scene.duration || 0), 0);
  return {
    musicMood: state.project.musicMood,
    pacingSystem: selectedMotionSystem().tempo,
    totalDuration: Number(totalDuration.toFixed(2)),
    markers: scenes.map((scene, index) => ({
      time: Number(scenes.slice(0, index).reduce((sum, item) => sum + Number(item.duration || 0), 0).toFixed(2)),
      label: scene.beatMarker,
      transition: scene.transition
    }))
  };
}

function buildPreviewHtml(payload) {
  const first = payload.orderedPhotos[0] ?? demoPhotos[0];
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(payload.project.title)} Preview</title><style>body{margin:0;font-family:Arial,sans-serif;background:#f8f6f1;color:#101113;padding:24px}.reel{position:relative;max-width:390px;aspect-ratio:9/16;margin:auto;border:8px solid ${payload.template.accentColor};border-radius:28px;overflow:hidden;background:#111}.reel img{width:100%;height:100%;object-fit:cover}.shade{position:absolute;inset:0;background:linear-gradient(transparent,rgba(0,0,0,.78))}.copy{position:absolute;inset:auto 18px 18px;color:white}.card{background:rgba(255,255,255,.94);color:#111;border-left:4px solid ${payload.template.accentColor};border-radius:8px;padding:14px}h1{font-size:32px;line-height:.98}</style></head><body><div class="reel"><img src="${first.uri}"><div class="shade"></div><div class="copy"><h1>${escapeHtml(payload.copy.hook)}</h1><p>${payload.project.price} - ${payload.project.beds} BD - ${payload.project.baths} BA</p><div class="card"><strong>${escapeHtml(payload.brandKit.name)}</strong><br>${escapeHtml(payload.brandKit.brokerage)}<br><b>${escapeHtml(payload.brandKit.ctaText)}</b></div></div></div><pre>${escapeHtml(JSON.stringify(payload.copy, null, 2))}</pre></body></html>`;
}

function agentStrip() {
  const headshot = state.brandKit.headshotUri ? `<img class="agent-headshot" src="${escapeAttr(state.brandKit.headshotUri)}" alt="">` : "";
  const logo = state.brandKit.logoUri ? `<img class="agent-logo" src="${escapeAttr(state.brandKit.logoUri)}" alt="">` : "";
  return `
    <div class="agent-strip">
      ${headshot}
      <span>
        <strong>${escapeHtml(state.brandKit.name)}</strong>
        <small>${escapeHtml(state.brandKit.brokerage)}</small>
        <b>${escapeHtml(state.brandKit.ctaText)}</b>
      </span>
      ${logo}
    </div>
  `;
}

function outroBlock() {
  if (state.project.outroVariation === "Brokerage logo only") {
    return `
      <div class="agent-strip brokerage-only">
        <span>
          <strong>${escapeHtml(state.brandKit.brokerage)}</strong>
          <small>${escapeHtml(state.brandKit.website)}</small>
          <b>${escapeHtml(state.project.cta)}</b>
        </span>
      </div>
    `;
  }
  if (state.project.outroVariation === "Social follow CTA") {
    return `
      <div class="agent-strip">
        <span>
          <strong>Follow ${escapeHtml(state.brandKit.instagram || state.brandKit.name)}</strong>
          <small>${escapeHtml(state.brandKit.brokerage)}</small>
          <b>${escapeHtml(state.project.cta)}</b>
        </span>
      </div>
    `;
  }
  return agentStrip();
}

function complianceBlock() {
  if (!state.brandKit.complianceEnabled) return `<p class="muted">Compliance fields are disabled for this export.</p>`;
  return `
    <div class="compliance-lines">
      <p>${escapeHtml(state.brandKit.listingCourtesyOf)}</p>
      <p>${escapeHtml(state.brandKit.brokerageDisclaimer)}</p>
      <p>${state.brandKit.equalHousing ? "Equal Housing Opportunity" : "Equal Housing Opportunity hidden"}</p>
      <p>${escapeHtml(state.brandKit.mlsDisclaimer)}</p>
    </div>
  `;
}

function renderPricing() {
  renderLayout(`
    <div class="screen-title"><p class="eyebrow">Pricing & credits</p><h2>Plans for every agent team</h2><p>Stripe is mocked locally, but the plan structure and credit logic are ready for checkout wiring.</p></div>
    <section class="pricing-grid">
      ${pricingCard("Free trial", "$0", "10 credits", "Try listing reels with mock rendering.", "Current")}
      ${pricingCard("Pay-per-export", "$9", "1 content pack", "Great for occasional listings.", "Buy export")}
      ${pricingCard("Monthly Pro", "$49/mo", "40 credits", "For active agents posting weekly.", "Start Pro")}
      ${pricingCard("Brokerage plan", "Custom", "Team credits", "Admin billing, templates, and compliance defaults.", "Contact sales")}
    </section>
    <section class="panel">
      <div class="section-title"><p>Stripe mode</p><h3>${featureFlags.MOCK_STRIPE ? "Mocked" : "Live"}</h3></div>
      <p class="muted">${featureFlags.MOCK_STRIPE ? "Buttons do not create Stripe Checkout sessions yet." : "Connect these buttons to your Stripe Checkout endpoint."}</p>
    </section>
  `);
  bindPricingTracking();
}

function renderAnalytics() {
  const summary = analyticsSummary();
  const pricingEvents = state.analyticsEvents.filter((event) => event.type === "pricing_click");
  const recent = state.analyticsEvents.slice(-8).reverse();
  renderLayout(`
    <div class="screen-title"><p class="eyebrow">Local analytics</p><h2>Founder validation dashboard</h2><p>All analytics are stored locally in this browser for demo validation.</p></div>
    <section class="analytics-grid">
      ${metricCard("Total visits", summary.visits)}
      ${metricCard("Total leads", summary.leads)}
      ${metricCard("Conversion rate", `${summary.conversionRate}%`)}
      ${metricCard("Most clicked pricing option", summary.mostClicked)}
      ${metricCard("Export intent count", summary.exportIntent)}
      ${metricCard("Most used template", summary.mostUsedTemplate)}
      ${metricCard("Most used hook", summary.mostUsedHook)}
    </section>
    <section class="panel">
      <div class="section-title"><p>Pricing clicks</p><h3>${pricingEvents.length} total</h3></div>
      ${pricingEvents.length ? pricingBreakdown() : emptyState("No pricing clicks yet", "Click pricing test cards on the Demo page to collect interest signals.")}
    </section>
    <section class="panel">
      <div class="section-title"><p>Recent events</p><h3>Last ${recent.length}</h3></div>
      ${recent.length ? recent.map((event) => `<div class="event-row"><span><strong>${escapeHtml(event.type)}</strong><small>${new Date(event.createdAt).toLocaleString()}</small></span><code>${escapeHtml(JSON.stringify(event.metadata))}</code></div>`).join("") : emptyState("No analytics yet", "Visit /demo and interact with pricing or exports to collect events.")}
      <div class="actions">
        <button class="secondary" data-export-analytics>Export analytics JSON</button>
        <button class="danger" data-clear-analytics>Clear analytics</button>
      </div>
    </section>
  `);
  document.querySelector("[data-export-analytics]").addEventListener("click", () => {
    downloadFile("estatemotion-local-analytics.json", "application/json", JSON.stringify({ summary, events: state.analyticsEvents, leads: state.leads }, null, 2));
    showToast("Analytics JSON exported");
  });
  document.querySelector("[data-clear-analytics]").addEventListener("click", () => {
    setState((current) => ({ ...current, analyticsEvents: [] }));
    showToast("Analytics cleared");
  });
}

function metricCard(label, value) {
  return `<article class="metric-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`;
}

function pricingBreakdown() {
  const counts = state.analyticsEvents.filter((event) => event.type === "pricing_click").reduce((all, event) => {
    const plan = event.metadata.plan ?? "Unknown";
    all[plan] = (all[plan] ?? 0) + 1;
    return all;
  }, {});
  return Object.entries(counts).map(([plan, count]) => `<div class="queue-row"><span>${escapeHtml(plan)}</span><b>${count}</b></div>`).join("");
}

function pricingCard(name, price, credits, copy, cta) {
  return `
    <article class="pricing-card">
      <p>${name}</p>
      <h3>${price}</h3>
      <strong>${credits}</strong>
      <span>${copy}</span>
      <button class="${cta === "Current" ? "secondary" : "primary"}" data-pricing-plan="${escapeAttr(name)}">${cta}</button>
    </article>
  `;
}

function bindPricingTracking() {
  document.querySelectorAll("[data-pricing-plan]").forEach((button) => {
    button.addEventListener("click", () => {
      trackEvent("pricing_click", { plan: button.dataset.pricingPlan });
      showToast(`${button.dataset.pricingPlan} pricing interest tracked`);
    });
  });
}

function validateLead() {
  const form = state.earlyAccessForm;
  if (!form.name.trim()) return "Name is required for early access.";
  if (!form.email.trim() || !form.email.includes("@")) return "A valid email is required.";
  if (!form.brokerage.trim()) return "Brokerage is required.";
  return "";
}

function submitLead() {
  const error = validateLead();
  if (error) {
    setError(error);
    return;
  }
  const lead = {
    id: `lead-${Date.now()}`,
    submittedAt: new Date().toISOString(),
    ...state.earlyAccessForm
  };
  setState((current) => ({
    ...current,
    error: "",
    leads: [...current.leads, lead],
    earlyAccessForm: structuredClone(defaultState.earlyAccessForm)
  }));
  trackEvent("early_access_submit", { city: lead.city, brokerage: lead.brokerage, monthlyListings: lead.monthlyListings });
  showToast("Early access request saved locally");
}

function exportLeadsCsv() {
  if (!state.leads.length) {
    setError("No early-access submissions to export yet.");
    return;
  }
  const headers = ["submittedAt", "name", "email", "brokerage", "city", "monthlyListings", "biggestProblem"];
  const rows = state.leads.map((lead) => headers.map((key) => csvCell(lead[key])).join(","));
  downloadFile("estatemotion-early-access-leads.csv", "text/csv", `${headers.join(",")}\n${rows.join("\n")}`);
  showToast("Early-access CSV exported");
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function downloadFile(name, type, body) {
  const blob = new Blob([body], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

async function copyText(text, successMessage) {
  try {
    if (!navigator.clipboard) {
      throw new Error("Clipboard unavailable");
    }
    await navigator.clipboard.writeText(text);
    showToast(successMessage);
  } catch {
    downloadFile(`${slug(successMessage)}.txt`, "text/plain", text);
    showToast("Clipboard unavailable, downloaded text instead");
  }
}

function emptyState(title, body) {
  return `
    <div class="empty-state">
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(body)}</span>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("\n", " ");
}

function slug(value) {
  return String(value || "estatemotion-export").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function render() {
  if (isProtectedAppRoute() && !featureFlags.MOCK_SUPABASE) {
    if (state.authStatus === "checking" || state.authStatus === "loading") {
      renderLayout(`<section class="panel elevated"><div class="state-banner loading-state"><span class="spinner"></span><strong>Connecting to Supabase...</strong></div></section>`);
      return;
    }
    if (!authUser) {
      renderAuth();
      return;
    }
  }
  const screens = {
    demo: renderDemoLandingPremium,
    dashboard: renderDashboard,
    onboarding: renderOnboarding,
    create: renderCreate,
    upload: renderUpload,
    details: renderDetails,
    template: renderTemplate,
    preview: renderPreview,
    edit: renderEdit,
    brand: renderBrand,
    pricing: renderPricing,
    analytics: renderAnalytics,
    export: renderExport
  };
  (screens[state.screen] ?? renderDashboard)();
}

maybeStartOnboarding();
render();
bootstrapSupabase();
