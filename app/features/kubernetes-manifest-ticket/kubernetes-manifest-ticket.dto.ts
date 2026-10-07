export interface ValueListItem {
  value: string;
  label: string;
}

export type ValueListResponse = ValueListItem[];

export interface ErrorResponse {
  message?: string;
}

export interface FetchValueListResult {
  ok: boolean;
  data: ValueListResponse | ErrorResponse | null;
}

export type KubernetesManifestAction = "apply" | "create" | "delete";

export interface CreateKubernetesManifestTicketPayload {
  assignee: string;
  subject: string;
  description: string;
  action: KubernetesManifestAction;
  codeYaml: string;
}

export interface PostResult {
  ok: boolean;
  data: ErrorResponse | null;
}

export interface KubernetesManifestTicket {
  id: number;
  number: number;
  informer: string;
  assignee: string;
  department: string;
  subject: string;
  status: "OPEN" | "IN_PROGRESS" | "APPROVED" | "REJECTED";
  description: string;
  namespace: string;
  action: KubernetesManifestAction;
  codeYaml: string;
  response: string;
  createdAt: string;
  updatedAt: string;
}

export interface FetchTicketsResult {
  ok: boolean;
  data: KubernetesManifestTicket[] | ErrorResponse | null;
}

export interface FetchTicketResult {
  ok: boolean;
  status: number;
  data: KubernetesManifestTicket | ErrorResponse | null;
}

export interface UpdateTicketResult {
  ok: boolean;
  data: KubernetesManifestTicket | ErrorResponse | null;
}
