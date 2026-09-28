import type {
  CreateDatabaseProvisioningTicketPayload,
  DatabaseProvisioningTicket,
  ErrorResponse,
  FetchTicketResult,
  FetchTicketsResult,
  FetchValueListResult,
  PostResult,
  UpdateTicketResult,
  ValueListResponse,
} from "@/app/features/database-provisioning-ticket/database-provisioning-ticket.dto";

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

export async function postDatabaseProvisioningTicket(
  payload: CreateDatabaseProvisioningTicketPayload,
): Promise<PostResult> {
  const response = await fetch("/api/tickets/database/provisioning", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await response
    .json()
    .catch(() => null)) as ErrorResponse | null;

  return { ok: response.ok, data };
}

export async function fetchDatabaseProvisioningTickets(
  signal?: AbortSignal,
): Promise<FetchTicketsResult> {
  const response = await fetch("/api/tickets/database/provisioning", {
    signal,
  });
  const data = (await response.json().catch(() => null)) as
    | DatabaseProvisioningTicket[]
    | ErrorResponse
    | null;

  return { ok: response.ok, data };
}

export async function fetchDatabaseProvisioningTicket(
  ticketNumber: string,
  signal?: AbortSignal,
): Promise<FetchTicketResult> {
  const response = await fetch(
    `/api/tickets/database/provisioning/${ticketNumber}`,
    { signal },
  );
  const data = (await response.json().catch(() => null)) as
    | DatabaseProvisioningTicket
    | ErrorResponse
    | null;

  return { ok: response.ok, status: response.status, data };
}

export async function patchDatabaseProvisioningTicket(
  ticketNumber: number,
  action: "approve" | "reject",
  signal?: AbortSignal,
): Promise<UpdateTicketResult> {
  const response = await fetch(
    `/api/tickets/database/provisioning/${ticketNumber}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
      signal,
    },
  );
  const data = (await response.json().catch(() => null)) as
    | DatabaseProvisioningTicket
    | ErrorResponse
    | null;

  return { ok: response.ok, data };
}
