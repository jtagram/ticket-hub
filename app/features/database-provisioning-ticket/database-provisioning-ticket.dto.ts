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

export interface CreateDatabaseProvisioningTicketPayload {
  assignee: string;
  subject: string;
  description: string;
  dbDeployment: string;
  newDbName: string;
}

export interface PostResult {
  ok: boolean;
  data: ErrorResponse | null;
}

export interface DatabaseProvisioningTicket {
  id: number;
  number: number;
  informer: string;
  assignee: string;
  department: string;
  subject: string;
  status: "OPEN" | "IN_PROGRESS" | "APPROVED" | "REJECTED";
  description: string;
  response: string;
  dbNamespace: string;
  dbDeployment: string;
  newDbName: string;
  createdAt: string;
  updatedAt: string;
}

export interface FetchTicketsResult {
  ok: boolean;
  data: DatabaseProvisioningTicket[] | ErrorResponse | null;
}

export interface FetchTicketResult {
  ok: boolean;
  status: number;
  data: DatabaseProvisioningTicket | ErrorResponse | null;
}

export interface UpdateTicketResult {
  ok: boolean;
  data: DatabaseProvisioningTicket | ErrorResponse | null;
}
