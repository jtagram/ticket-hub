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

export interface CreateDatabaseManagementTicketPayload {
  assignee: string;
  subject: string;
  description: string;
  dbDeployment: string;
  dbName: string;
  sqlCode: string;
}

export interface PostResult {
  ok: boolean;
  data: ErrorResponse | null;
}

export interface DatabaseManagementTicket {
  id: number;
  number: number;
  informer: string;
  assignee: string;
  department: string;
  subject: string;
  status: "OPEN" | "APPROVED" | "REJECTED";
  description: string;
  response: string;
  dbNamespace: string;
  dbDeployment: string;
  dbName: string;
  sqlCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface FetchTicketsResult {
  ok: boolean;
  data: DatabaseManagementTicket[] | ErrorResponse | null;
}

export interface FetchTicketResult {
  ok: boolean;
  status: number;
  data: DatabaseManagementTicket | ErrorResponse | null;
}

export interface UpdateTicketResult {
  ok: boolean;
  data: DatabaseManagementTicket | ErrorResponse | null;
}
