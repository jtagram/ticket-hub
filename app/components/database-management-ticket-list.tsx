"use client";

import { useEffect, useState } from "react";

interface DatabaseManagementTicket {
  id: number;
  number: number;
  informer: string;
  subject: string;
  createdAt: string;
}

interface ErrorResponse {
  message?: string;
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("es-AR");
}

export function DatabaseManagementTicketList() {
  const [tickets, setTickets] = useState<DatabaseManagementTicket[] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTickets() {
      try {
        const response = await fetch("/api/tickets/database/management");
        const data = (await response
          .json()
          .catch(() => null)) as
          | DatabaseManagementTicket[]
          | ErrorResponse
          | null;

        if (cancelled) return;

        if (!response.ok) {
          setError(
            (data as ErrorResponse | null)?.message ??
              "No se pudieron obtener los tickets.",
          );
          return;
        }

        setTickets((data as DatabaseManagementTicket[]) ?? []);
      } catch {
        if (!cancelled) {
          setError("No se pudo conectar con el servidor.");
        }
      }
    }

    loadTickets();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="max-w-2xl">
      <h2 className="mb-6 text-xl font-semibold text-black dark:text-zinc-50">
        Tickets de gestión de base de datos
      </h2>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      {!error && tickets === null && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Cargando…</p>
      )}

      {!error && tickets !== null && tickets.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Todavía no hay tickets creados.
        </p>
      )}

      {!error && tickets !== null && tickets.length > 0 && (
        <ul className="flex flex-col gap-3">
          {tickets.map((ticket) => (
            <li
              key={ticket.id}
              className="rounded border border-black/[.08] p-4 dark:border-white/[.145]"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-black dark:text-zinc-50">
                  Ticket #{ticket.number}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {formatDate(ticket.createdAt)}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                {ticket.subject}
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Informante: {ticket.informer}
              </p>
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                ID: {ticket.id}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
