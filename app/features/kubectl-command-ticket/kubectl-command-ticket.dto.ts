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

export interface CreateKubectlCommandTicketPayload {
  assignee: string;
  subject: string;
  description: string;
  kubectlCommand: string;
}

export interface PostResult {
  ok: boolean;
  data: ErrorResponse | null;
}

export interface KubectlCommandTicket {
  id: number;
  number: number;
  informer: string;
  assignee: string;
  department: string;
  subject: string;
  status: "OPEN" | "APPROVED" | "REJECTED";
  description: string;
  kubectlCommand: string;
  response: string;
  createdAt: string;
  updatedAt: string;
}

export interface FetchTicketsResult {
  ok: boolean;
  data: KubectlCommandTicket[] | ErrorResponse | null;
}

export interface FetchTicketResult {
  ok: boolean;
  status: number;
  data: KubectlCommandTicket | ErrorResponse | null;
}

export interface UpdateTicketResult {
  ok: boolean;
  data: KubectlCommandTicket | ErrorResponse | null;
}
