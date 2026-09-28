import {
  fetchAssignees,
  fetchServerManagementTicket,
  fetchServerManagementTickets,
  patchServerManagementTicket,
  postServerManagementTicket,
} from "@/app/features/server-management-ticket/server-management-ticket.connector";
import type {
  CreateServerManagementTicketPayload,
  ErrorResponse,
  FetchTicketResult,
  FetchTicketsResult,
  FetchValueListResult,
  PostResult,
  ServerManagementTicket,
  UpdateTicketResult,
  ValueListItem,
  ValueListResponse,
} from "@/app/features/server-management-ticket/server-management-ticket.dto";

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

export async function createServerManagementTicket(
  payload: CreateServerManagementTicketPayload,
): Promise<void> {
  let result: PostResult;
  try {
    result = await postServerManagementTicket(payload);
  } catch {
    throw new Error("No se pudo conectar con el servidor.");
  }

  if (!result.ok) {
    throw new Error(result.data?.message ?? "No se pudo crear el ticket.");
  }
}

export async function getServerManagementTickets(
  signal?: AbortSignal,
): Promise<ServerManagementTicket[]> {
  let result: FetchTicketsResult;
  try {
    result = await fetchServerManagementTickets(signal);
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

  return (result.data as ServerManagementTicket[]) ?? [];
}

export async function getServerManagementTicket(
  ticketNumber: string,
  signal?: AbortSignal,
): Promise<ServerManagementTicket> {
  let result: FetchTicketResult;
  try {
    result = await fetchServerManagementTicket(ticketNumber, signal);
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

  return result.data as ServerManagementTicket;
}

export async function updateServerManagementTicket(
  ticketNumber: number,
  action: "approve" | "reject",
  signal?: AbortSignal,
): Promise<ServerManagementTicket> {
  let result: UpdateTicketResult;
  try {
    result = await patchServerManagementTicket(ticketNumber, action, signal);
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

  return result.data as ServerManagementTicket;
}
