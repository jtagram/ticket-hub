export type NavItemId =
  | "request-database-management"
  | "view-database-management-tickets"
  | "search-database-management-ticket"
  | "request-database-provisioning"
  | "view-database-provisioning-tickets"
  | "search-database-provisioning-ticket"
  | "request-server-management"
  | "view-server-management-tickets"
  | "search-server-management-ticket"
  | "request-kubernetes-manifest"
  | "view-kubernetes-manifest-tickets"
  | "search-kubernetes-manifest-ticket";

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
  {
    id: "search-database-management-ticket",
    label: "Buscar ticket de gestión de base de datos",
  },
  {
    id: "request-database-provisioning",
    label: "Solicitar aprovisionamiento de base de datos",
  },
  {
    id: "view-database-provisioning-tickets",
    label: "Ver tickets de aprovisionamiento de base de datos",
  },
  {
    id: "search-database-provisioning-ticket",
    label: "Buscar ticket de aprovisionamiento de base de datos",
  },
  {
    id: "request-server-management",
    label: "Solicitar gestión de servidor",
  },
  {
    id: "view-server-management-tickets",
    label: "Ver tickets de gestión de servidor",
  },
  {
    id: "search-server-management-ticket",
    label: "Buscar ticket de gestión de servidor",
  },
  {
    id: "request-kubernetes-manifest",
    label: "Solicitar gestión de manifiestos de Kubernetes",
  },
  {
    id: "view-kubernetes-manifest-tickets",
    label: "Ver tickets de gestión de manifiestos de Kubernetes",
  },
  {
    id: "search-kubernetes-manifest-ticket",
    label: "Buscar ticket de gestión de manifiestos de Kubernetes",
  },
];
