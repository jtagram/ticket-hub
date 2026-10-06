import type {
  CreateServerManagementTicketPayload,
  ErrorResponse,
  FetchTicketResult,
  FetchTicketsResult,
  FetchValueListResult,
  PostResult,
  ServerManagementTicket,
  UpdateTicketResult,
  ValueListResponse,
} from "@/app/features/server-management-ticket/server-management-ticket.dto";

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

export async function postServerManagementTicket(
  payload: CreateServerManagementTicketPayload,
): Promise<PostResult> {
  const response = await fetch("/api/tickets/server/management", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await response
    .json()
    .catch(() => null)) as ErrorResponse | null;

  return { ok: response.ok, data };
}

export async function fetchServerManagementTickets(
  signal?: AbortSignal,
): Promise<FetchTicketsResult> {
  const response = await fetch("/api/tickets/server/management", {
    signal,
  });
  const data = (await response.json().catch(() => null)) as
    | ServerManagementTicket[]
    | ErrorResponse
    | null;

  return { ok: response.ok, data };
}

export async function fetchServerManagementTicket(
  ticketNumber: string,
  signal?: AbortSignal,
): Promise<FetchTicketResult> {
  const response = await fetch(
    `/api/tickets/server/management/${encodeURIComponent(ticketNumber)}`,
    { signal },
  );
  const data = (await response.json().catch(() => null)) as
    | ServerManagementTicket
    | ErrorResponse
    | null;

  return { ok: response.ok, status: response.status, data };
}

export async function patchServerManagementTicket(
  ticketNumber: number,
  action: "approve" | "reject",
  signal?: AbortSignal,
): Promise<UpdateTicketResult> {
  const response = await fetch(
    `/api/tickets/server/management/${ticketNumber}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
      signal,
    },
  );
  const data = (await response.json().catch(() => null)) as
    | ServerManagementTicket
    | ErrorResponse
    | null;

  return { ok: response.ok, data };
}
