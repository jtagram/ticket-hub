import {
  fetchAssignees,
  fetchDatabaseManagementTicket,
  fetchDatabaseManagementTickets,
  fetchDbNames,
  fetchDeployments,
  patchDatabaseManagementTicket,
  postDatabaseManagementTicket,
} from "@/app/features/database-management-ticket/database-management-ticket.connector";
import type {
  CreateDatabaseManagementTicketPayload,
  DatabaseManagementTicket,
  ErrorResponse,
  FetchTicketResult,
  FetchTicketsResult,
  FetchValueListResult,
  PostResult,
  UpdateTicketResult,
  ValueListItem,
  ValueListResponse,
} from "@/app/features/database-management-ticket/database-management-ticket.dto";

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

export function getDeployments(
  namespace: string,
  signal?: AbortSignal,
): Promise<ValueListItem[]> {
  return resolveValueList(
    fetchDeployments(namespace, signal),
    signal,
    "No se pudieron obtener los deployments.",
  );
}

export function getDbNames(
  namespace: string,
  deployment: string,
  signal?: AbortSignal,
): Promise<ValueListItem[]> {
  return resolveValueList(
    fetchDbNames(namespace, deployment, signal),
    signal,
    "No se pudieron obtener las bases de datos.",
  );
}

export async function createDatabaseManagementTicket(
  payload: CreateDatabaseManagementTicketPayload,
): Promise<void> {
  let result: PostResult;
  try {
    result = await postDatabaseManagementTicket(payload);
  } catch {
    throw new Error("No se pudo conectar con el servidor.");
  }

  if (!result.ok) {
    throw new Error(result.data?.message ?? "No se pudo crear el ticket.");
  }
}

export async function getDatabaseManagementTickets(
  signal?: AbortSignal,
): Promise<DatabaseManagementTicket[]> {
  let result: FetchTicketsResult;
  try {
    result = await fetchDatabaseManagementTickets(signal);
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

  return (result.data as DatabaseManagementTicket[]) ?? [];
}

export async function getDatabaseManagementTicket(
  ticketNumber: string,
  signal?: AbortSignal,
): Promise<DatabaseManagementTicket> {
  let result: FetchTicketResult;
  try {
    result = await fetchDatabaseManagementTicket(ticketNumber, signal);
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

  return result.data as DatabaseManagementTicket;
}

export async function updateDatabaseManagementTicket(
  ticketNumber: number,
  action: "approve" | "reject",
  signal?: AbortSignal,
): Promise<DatabaseManagementTicket> {
  let result: UpdateTicketResult;
  try {
    result = await patchDatabaseManagementTicket(ticketNumber, action, signal);
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

  return result.data as DatabaseManagementTicket;
}
