import type {
  CreateKubernetesManifestTicketPayload,
  ErrorResponse,
  FetchTicketResult,
  FetchTicketsResult,
  FetchValueListResult,
  KubernetesManifestTicket,
  PostResult,
  UpdateTicketResult,
  ValueListResponse,
} from "@/app/features/kubernetes-manifest-ticket/kubernetes-manifest-ticket.dto";

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

export async function postKubernetesManifestTicket(
  payload: CreateKubernetesManifestTicketPayload,
): Promise<PostResult> {
  const response = await fetch("/api/tickets/kubernetes/manifest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await response
    .json()
    .catch(() => null)) as ErrorResponse | null;

  return { ok: response.ok, data };
}

export async function fetchKubernetesManifestTickets(
  signal?: AbortSignal,
): Promise<FetchTicketsResult> {
  const response = await fetch("/api/tickets/kubernetes/manifest", {
    signal,
  });
  const data = (await response.json().catch(() => null)) as
    | KubernetesManifestTicket[]
    | ErrorResponse
    | null;

  return { ok: response.ok, data };
}

export async function fetchKubernetesManifestTicket(
  ticketNumber: string,
  signal?: AbortSignal,
): Promise<FetchTicketResult> {
  const response = await fetch(
    `/api/tickets/kubernetes/manifest/${encodeURIComponent(ticketNumber)}`,
    { signal },
  );
  const data = (await response.json().catch(() => null)) as
    | KubernetesManifestTicket
    | ErrorResponse
    | null;

  return { ok: response.ok, status: response.status, data };
}

export async function patchKubernetesManifestTicket(
  ticketNumber: number,
  decision: "approve" | "reject",
  signal?: AbortSignal,
): Promise<UpdateTicketResult> {
  const response = await fetch(
    `/api/tickets/kubernetes/manifest/${ticketNumber}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: decision }),
      signal,
    },
  );
  const data = (await response.json().catch(() => null)) as
    | KubernetesManifestTicket
    | ErrorResponse
    | null;

  return { ok: response.ok, data };
}
