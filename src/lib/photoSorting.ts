import { PhotoCategory, ProjectPhoto } from "../data/types";

const categoryRules: Array<[PhotoCategory, RegExp]> = [
  ["Exterior hero", /(exterior|front|curb|street|hero)/i],
  ["Entry transition", /(entry|foyer|door|hall|transition)/i],
  ["Kitchen", /(kitchen|island|pantry)/i],
  ["Living room", /(living|great-room|family|lounge)/i],
  ["Primary bedroom", /(primary|master|bedroom|suite)/i],
  ["Bathroom", /(bath|vanity|shower|tub)/i],
  ["Backyard", /(yard|pool|patio|garden|terrace|balcony)/i],
  ["Detail shots", /(detail|fireplace|laundry|garage|closet|fixture)/i]
];

export function categorizePhoto(fileName: string): PhotoCategory {
  return categoryRules.find(([, rule]) => rule.test(fileName))?.[0] ?? "Detail shots";
}

export function sortPhotosForReel(photos: ProjectPhoto[]) {
  const priority: PhotoCategory[] = ["Exterior hero", "Entry transition", "Kitchen", "Living room", "Primary bedroom", "Bathroom", "Backyard", "Detail shots"];
  return [...photos].sort((a, b) => priority.indexOf(a.category) - priority.indexOf(b.category) || a.order - b.order);
}
