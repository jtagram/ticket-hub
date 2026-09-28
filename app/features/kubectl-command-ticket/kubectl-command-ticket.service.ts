import {
  fetchAssignees,
  fetchKubectlCommandTicket,
  fetchKubectlCommandTickets,
  patchKubectlCommandTicket,
  postKubectlCommandTicket,
} from "@/app/features/kubectl-command-ticket/kubectl-command-ticket.connector";
import type {
  CreateKubectlCommandTicketPayload,
  ErrorResponse,
  FetchTicketResult,
  FetchTicketsResult,
  FetchValueListResult,
  KubectlCommandTicket,
  PostResult,
  UpdateTicketResult,
  ValueListItem,
  ValueListResponse,
} from "@/app/features/kubectl-command-ticket/kubectl-command-ticket.dto";

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

export async function createKubectlCommandTicket(
  payload: CreateKubectlCommandTicketPayload,
): Promise<void> {
  let result: PostResult;
  try {
    result = await postKubectlCommandTicket(payload);
  } catch {
    throw new Error("No se pudo conectar con el servidor.");
  }

  if (!result.ok) {
    throw new Error(result.data?.message ?? "No se pudo crear el ticket.");
  }
}

export async function getKubectlCommandTickets(
  signal?: AbortSignal,
): Promise<KubectlCommandTicket[]> {
  let result: FetchTicketsResult;
  try {
    result = await fetchKubectlCommandTickets(signal);
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

  return (result.data as KubectlCommandTicket[]) ?? [];
}

export async function getKubectlCommandTicket(
  ticketNumber: string,
  signal?: AbortSignal,
): Promise<KubectlCommandTicket> {
  let result: FetchTicketResult;
  try {
    result = await fetchKubectlCommandTicket(ticketNumber, signal);
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

  return result.data as KubectlCommandTicket;
}

export async function updateKubectlCommandTicket(
  ticketNumber: number,
  action: "approve" | "reject",
  signal?: AbortSignal,
): Promise<KubectlCommandTicket> {
  let result: UpdateTicketResult;
  try {
    result = await patchKubectlCommandTicket(ticketNumber, action, signal);
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

  return result.data as KubectlCommandTicket;
}
