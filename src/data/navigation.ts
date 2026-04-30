export type ScreenKey =
  | "welcome"
  | "login"
  | "dashboard"
  | "create"
  | "upload"
  | "details"
  | "template"
  | "preview"
  | "edit"
  | "export"
  | "brand"
  | "billing";

export const navItems: Array<{ key: ScreenKey; label: string }> = [
  { key: "dashboard", label: "Dashboard" },
  { key: "create", label: "Project" },
  { key: "brand", label: "Brand Kit" },
  { key: "billing", label: "Credits" }
];
