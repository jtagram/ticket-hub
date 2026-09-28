import type {
  CreateDatabaseManagementTicketPayload,
  DatabaseManagementTicket,
  ErrorResponse,
  FetchTicketResult,
  FetchTicketsResult,
  FetchValueListResult,
  PostResult,
  UpdateTicketResult,
  ValueListResponse,
} from "@/app/features/database-management-ticket/database-management-ticket.dto";

async function fetchValueList(
  url: string,
  signal?: AbortSignal,
): Promise<FetchValueListResult> {
  const response = await fetch(url, { signal });
  const data = (await response
    .json()
    .catch(() => null)) as ValueListResponse | ErrorResponse | null;

  return { ok: response.ok, data };
}

export function fetchAssignees(
  signal?: AbortSignal,
): Promise<FetchValueListResult> {
  return fetchValueList("/api/value-lists/assignees", signal);
}

export function fetchDeployments(
  namespace: string,
  signal?: AbortSignal,
): Promise<FetchValueListResult> {
  return fetchValueList(
    `/api/value-lists/database-deployments?namespace=${namespace}`,
    signal,
  );
}

export function fetchDbNames(
  namespace: string,
  deployment: string,
  signal?: AbortSignal,
): Promise<FetchValueListResult> {
  return fetchValueList(
    `/api/value-lists/database-names?namespace=${namespace}&deployment=${deployment}`,
    signal,
  );
}

export async function postDatabaseManagementTicket(
  payload: CreateDatabaseManagementTicketPayload,
): Promise<PostResult> {
  const response = await fetch("/api/tickets/database/management", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await response
    .json()
    .catch(() => null)) as ErrorResponse | null;

  return { ok: response.ok, data };
}

export async function fetchDatabaseManagementTickets(
  signal?: AbortSignal,
): Promise<FetchTicketsResult> {
  const response = await fetch("/api/tickets/database/management", {
    signal,
  });
  const data = (await response.json().catch(() => null)) as
    | DatabaseManagementTicket[]
    | ErrorResponse
    | null;

  return { ok: response.ok, data };
}

export async function fetchDatabaseManagementTicket(
  ticketNumber: string,
  signal?: AbortSignal,
): Promise<FetchTicketResult> {
  const response = await fetch(
    `/api/tickets/database/management/${ticketNumber}`,
    { signal },
  );
  const data = (await response.json().catch(() => null)) as
    | DatabaseManagementTicket
    | ErrorResponse
    | null;

  return { ok: response.ok, status: response.status, data };
}

export async function patchDatabaseManagementTicket(
  ticketNumber: number,
  action: "approve" | "reject",
  signal?: AbortSignal,
): Promise<UpdateTicketResult> {
  const response = await fetch(
    `/api/tickets/database/management/${ticketNumber}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
      signal,
    },
  );
  const data = (await response.json().catch(() => null)) as
    | DatabaseManagementTicket
    | ErrorResponse
    | null;

  return { ok: response.ok, data };
}
