import {
  fetchAssignees,
  fetchKubernetesManifestTicket,
  fetchKubernetesManifestTickets,
  patchKubernetesManifestTicket,
  postKubernetesManifestTicket,
} from "@/app/features/kubernetes-manifest-ticket/kubernetes-manifest-ticket.connector";
import type {
  CreateKubernetesManifestTicketPayload,
  ErrorResponse,
  FetchTicketResult,
  FetchTicketsResult,
  FetchValueListResult,
  KubernetesManifestTicket,
  PostResult,
  UpdateTicketResult,
  ValueListItem,
  ValueListResponse,
} from "@/app/features/kubernetes-manifest-ticket/kubernetes-manifest-ticket.dto";

async function resolveValueList(
  fetchResult: Promise<FetchValueListResult>,
  signal: AbortSignal | undefined,
  notOkFallbackMessage: string,
): Promise<ValueListItem[]> {
  let result: FetchValueListResult;
  try {
    result = await fetchResult;
  } catch (err) {
    if (signal?.aborted) {
      throw err;
    }
    throw new Error("No se pudo conectar con el servidor.");
  }

  if (!result.ok) {
    throw new Error(
      (result.data as ErrorResponse | null)?.message ?? notOkFallbackMessage,
    );
  }

  return (result.data as ValueListResponse) ?? [];
}

export function getAssignees(signal?: AbortSignal): Promise<ValueListItem[]> {
  return resolveValueList(
    fetchAssignees(signal),
    signal,
    "No se pudieron obtener los responsables.",
  );
}

export async function createKubernetesManifestTicket(
  payload: CreateKubernetesManifestTicketPayload,
): Promise<void> {
  let result: PostResult;
  try {
    result = await postKubernetesManifestTicket(payload);
  } catch {
    throw new Error("No se pudo conectar con el servidor.");
  }

  if (!result.ok) {
    throw new Error(result.data?.message ?? "No se pudo crear el ticket.");
  }
}

export async function getKubernetesManifestTickets(
  signal?: AbortSignal,
): Promise<KubernetesManifestTicket[]> {
  let result: FetchTicketsResult;
  try {
    result = await fetchKubernetesManifestTickets(signal);
  } catch (err) {
    if (signal?.aborted) {
      throw err;
    }
    throw new Error("No se pudo conectar con el servidor.");
  }

  if (!result.ok) {
    throw new Error(
      (result.data as ErrorResponse | null)?.message ??
        "No se pudieron obtener los tickets.",
    );
  }

  return (result.data as KubernetesManifestTicket[]) ?? [];
}

export async function getKubernetesManifestTicket(
  ticketNumber: string,
  signal?: AbortSignal,
): Promise<KubernetesManifestTicket> {
  let result: FetchTicketResult;
  try {
    result = await fetchKubernetesManifestTicket(ticketNumber, signal);
  } catch (err) {
    if (signal?.aborted) {
      throw err;
    }
    throw new Error("No se pudo conectar con el servidor.");
  }

  if (!result.ok) {
    throw new Error(
      result.status === 404
        ? "No se encontró ningún ticket con ese número."
        : (result.data as ErrorResponse | null)?.message ??
            "No se pudo obtener el ticket.",
    );
  }

  return result.data as KubernetesManifestTicket;
}

export async function updateKubernetesManifestTicket(
  ticketNumber: number,
  decision: "approve" | "reject",
  signal?: AbortSignal,
): Promise<KubernetesManifestTicket> {
  let result: UpdateTicketResult;
  try {
    result = await patchKubernetesManifestTicket(
      ticketNumber,
      decision,
      signal,
    );
  } catch (err) {
    if (signal?.aborted) {
      throw err;
    }
    throw new Error("No se pudo conectar con el servidor.");
  }

  if (!result.ok) {
    throw new Error(
      (result.data as ErrorResponse | null)?.message ??
        "No se pudo actualizar el ticket.",
    );
  }

  return result.data as KubernetesManifestTicket;
}
