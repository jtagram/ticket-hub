export type NavItemId =
  | "request-database-management"
  | "view-database-management-tickets";

export interface NavItem {
  id: NavItemId;
  label: string;
}

// Add future sidebar entries here; HomeShell renders whatever is listed.
export const NAV_ITEMS: NavItem[] = [
  {
    id: "request-database-management",
    label: "Solicitar gestión de base de datos",
  },
  {
    id: "view-database-management-tickets",
    label: "Ver ticket de gestión de base de datos",
  },
];
