export type RenderFormat = "9:16" | "1:1" | "16:9";

export type RenderInput = {
  projectId: string;
  outputName: string;
  format: RenderFormat;
  photos: Array<{ uri: string; category: string; order: number }>;
  overlays: Array<{ atSecond: number; text: string; placement: "top" | "center" | "bottom" }>;
  brandKit: {
    name: string;
    brokerage: string;
    headshotUri?: string;
    logoUri?: string;
    ctaText: string;
    primaryColor: string;
    accentColor: string;
  };
  compliance?: {
    listingCourtesyOf?: string;
    equalHousing?: boolean;
    mlsDisclaimer?: string;
  };
};
