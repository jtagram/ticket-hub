import type {
  CreateKubectlCommandTicketPayload,
  ErrorResponse,
  FetchTicketResult,
  FetchTicketsResult,
  FetchValueListResult,
  KubectlCommandTicket,
  PostResult,
  UpdateTicketResult,
  ValueListResponse,
} from "@/app/features/kubectl-command-ticket/kubectl-command-ticket.dto";

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

export async function postKubectlCommandTicket(
  payload: CreateKubectlCommandTicketPayload,
): Promise<PostResult> {
  const response = await fetch("/api/tickets/kubernetes/kubectl", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await response
    .json()
    .catch(() => null)) as ErrorResponse | null;

  return { ok: response.ok, data };
}

export async function fetchKubectlCommandTickets(
  signal?: AbortSignal,
): Promise<FetchTicketsResult> {
  const response = await fetch("/api/tickets/kubernetes/kubectl", {
    signal,
  });
  const data = (await response.json().catch(() => null)) as
    | KubectlCommandTicket[]
    | ErrorResponse
    | null;

  return { ok: response.ok, data };
}

export async function fetchKubectlCommandTicket(
  ticketNumber: string,
  signal?: AbortSignal,
): Promise<FetchTicketResult> {
  const response = await fetch(
    `/api/tickets/kubernetes/kubectl/${ticketNumber}`,
    { signal },
  );
  const data = (await response.json().catch(() => null)) as
    | KubectlCommandTicket
    | ErrorResponse
    | null;

  return { ok: response.ok, status: response.status, data };
}

export async function patchKubectlCommandTicket(
  ticketNumber: number,
  action: "approve" | "reject",
  signal?: AbortSignal,
): Promise<UpdateTicketResult> {
  const response = await fetch(
    `/api/tickets/kubernetes/kubectl/${ticketNumber}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
      signal,
    },
  );
  const data = (await response.json().catch(() => null)) as
    | KubectlCommandTicket
    | ErrorResponse
    | null;

  return { ok: response.ok, data };
}
