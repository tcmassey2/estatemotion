export type ListingType = "Just Listed" | "Open House" | "Price Drop" | "Coming Soon" | "Sold" | "For Rent";
export type PhotoCategory = "Exterior hero" | "Entry transition" | "Exterior" | "Kitchen" | "Living room" | "Primary bedroom" | "Bathroom" | "Backyard" | "Detail shots";
export type VideoFormat = "9:16" | "1:1" | "16:9";

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  subscriptionStatus: "trial" | "active" | "past_due" | "free";
  creditBalance: number;
};

export type BrandKit = {
  name: string;
  brokerage: string;
  headshotUri: string;
  logoUri: string;
  phone: string;
  email: string;
  website: string;
  instagram: string;
  primaryColor: string;
  accentColor: string;
  ctaText: string;
  complianceEnabled: boolean;
  listingCourtesyOf: string;
  mlsDisclaimer: string;
};

export type ProjectPhoto = {
  id: string;
  uri: string;
  fileName: string;
  size?: number;
  category: PhotoCategory;
  order: number;
};

export type ListingProject = {
  id: string;
  title: string;
  address: string;
  price: string;
  beds: string;
  baths: string;
  squareFeet: string;
  neighborhood: string;
  city: string;
  listingType: ListingType;
  photos: ProjectPhoto[];
  hookText: string;
  caption: string;
  cta: string;
  hookPreset?: string;
  captionTone?: string;
  brandingVisible: boolean;
  authenticityMode: boolean;
  localAgentMode: boolean;
};

export type TemplateStyle = {
  id: string;
  name: string;
  description: string;
  fontStyle: string;
  textPlacement: "top" | "center" | "bottom" | "split";
  motionSpeed: "slow" | "medium" | "fast";
  transitionStyle: "soft fade" | "whip pan" | "gold wipe" | "cut rhythm" | "clean slide";
  introLayout: string;
  outroLayout: string;
  ctaWording: string;
  accentColor: string;
};

export type CopyPack = {
  hook: string;
  description: string;
  highlights: string[];
  instagramCaption: string;
  hashtags: string[];
  voiceoverScript: string;
};

export type ContentPackItem = {
  id: string;
  title: string;
  format: VideoFormat;
  durationSeconds: number;
  hook: string;
  sequenceCategories: PhotoCategory[];
  caption: string;
};

export type RenderJob = {
  id: string;
  outputName: string;
  format: VideoFormat;
  status: "queued" | "rendering" | "ready";
  estimatedSeconds: number;
  pipeline: string[];
};
