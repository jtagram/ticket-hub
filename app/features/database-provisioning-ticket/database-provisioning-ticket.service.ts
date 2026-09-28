import {
  fetchAssignees,
  fetchDatabaseProvisioningTicket,
  fetchDatabaseProvisioningTickets,
  fetchDeployments,
  patchDatabaseProvisioningTicket,
  postDatabaseProvisioningTicket,
} from "@/app/features/database-provisioning-ticket/database-provisioning-ticket.connector";
import type {
  CreateDatabaseProvisioningTicketPayload,
  DatabaseProvisioningTicket,
  ErrorResponse,
  FetchTicketResult,
  FetchTicketsResult,
  FetchValueListResult,
  PostResult,
  UpdateTicketResult,
  ValueListItem,
  ValueListResponse,
} from "@/app/features/database-provisioning-ticket/database-provisioning-ticket.dto";

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

export async function createDatabaseProvisioningTicket(
  payload: CreateDatabaseProvisioningTicketPayload,
): Promise<void> {
  let result: PostResult;
  try {
    result = await postDatabaseProvisioningTicket(payload);
  } catch {
    throw new Error("No se pudo conectar con el servidor.");
  }

  if (!result.ok) {
    throw new Error(result.data?.message ?? "No se pudo crear el ticket.");
  }
}

export async function getDatabaseProvisioningTickets(
  signal?: AbortSignal,
): Promise<DatabaseProvisioningTicket[]> {
  let result: FetchTicketsResult;
  try {
    result = await fetchDatabaseProvisioningTickets(signal);
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

  return (result.data as DatabaseProvisioningTicket[]) ?? [];
}

export async function getDatabaseProvisioningTicket(
  ticketNumber: string,
  signal?: AbortSignal,
): Promise<DatabaseProvisioningTicket> {
  let result: FetchTicketResult;
  try {
    result = await fetchDatabaseProvisioningTicket(ticketNumber, signal);
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

  return result.data as DatabaseProvisioningTicket;
}

export async function updateDatabaseProvisioningTicket(
  ticketNumber: number,
  action: "approve" | "reject",
  signal?: AbortSignal,
): Promise<DatabaseProvisioningTicket> {
  let result: UpdateTicketResult;
  try {
    result = await patchDatabaseProvisioningTicket(
      ticketNumber,
      action,
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

  return result.data as DatabaseProvisioningTicket;
}
