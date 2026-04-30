import { BrandKit, ListingProject, UserProfile } from "./types";

export const demoUser: UserProfile = {
  id: "user_demo",
  email: "agent@estatemotion.app",
  name: "Troy Massey",
  subscriptionStatus: "trial",
  creditBalance: 24
};

export const demoBrandKit: BrandKit = {
  name: "Troy Massey",
  brokerage: "Desert North Realty",
  headshotUri: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80",
  logoUri: "https://dummyimage.com/300x120/111111/c7a76c.png&text=DN+Realty",
  phone: "(602) 555-0148",
  email: "troy@example.com",
  website: "troymasseyrealestate.com",
  instagram: "@troysellsaz",
  primaryColor: "#111111",
  accentColor: "#C7A76C",
  ctaText: "Book a private tour",
  complianceEnabled: true,
  listingCourtesyOf: "Listing courtesy of Desert North Realty",
  mlsDisclaimer: "MLS disclaimer placeholder. Verify all facts and availability."
};

export const demoProject: ListingProject = {
  id: "project_demo",
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
  brandingVisible: true,
  authenticityMode: true,
  localAgentMode: true,
  photos: [
    {
      id: "photo_1",
      uri: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
      fileName: "exterior-front.jpg",
      category: "Exterior hero",
      order: 1
    },
    {
      id: "photo_2",
      uri: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80",
      fileName: "living-room.jpg",
      category: "Living room",
      order: 2
    },
    {
      id: "photo_3",
      uri: "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1200&q=80",
      fileName: "kitchen.jpg",
      category: "Kitchen",
      order: 3
    },
    {
      id: "photo_4",
      uri: "https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=1200&q=80",
      fileName: "primary-bedroom.jpg",
      category: "Primary bedroom",
      order: 4
    },
    {
      id: "photo_5",
      uri: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80",
      fileName: "backyard-pool.jpg",
      category: "Backyard",
      order: 5
    }
  ]
};
