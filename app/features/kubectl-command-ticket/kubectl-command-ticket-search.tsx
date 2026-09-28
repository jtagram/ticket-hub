"use client";

import { useState, type FormEvent } from "react";
import {
  getKubectlCommandTicket,
  updateKubectlCommandTicket,
} from "@/app/features/kubectl-command-ticket/kubectl-command-ticket.service";
import type { KubectlCommandTicket } from "@/app/features/kubectl-command-ticket/kubectl-command-ticket.dto";

const STATUS_LABELS: Record<KubectlCommandTicket["status"], string> = {
  OPEN: "Abierto",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
};

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("es-AR");
}

function formatResponse(response: string): string {
  if (!response) {
    return "Sin respuesta todavía.";
  }
  try {
    return JSON.stringify(JSON.parse(response), null, 2);
  } catch {
    return response;
  }
}

export function KubectlCommandTicketSearch() {
  const [ticketNumber, setTicketNumber] = useState("");
  const [ticket, setTicket] = useState<KubectlCommandTicket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleDecision(action: "approve" | "reject") {
    if (!ticket) return;
    setError(null);
    setIsUpdating(true);
    try {
      const updated = await updateKubectlCommandTicket(ticket.number, action);
      setTicket(updated);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setTicket(null);
    setIsSearching(true);
    setHasSearched(true);

    try {
      const found = await getKubectlCommandTicket(ticketNumber);
      setTicket(found);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSearching(false);
    }
  }

  const inputClassName =
    "w-full rounded border border-black/[.15] bg-white px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black/20 dark:border-white/[.2] dark:bg-black dark:text-zinc-50";
  const labelClassName =
    "mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

  return (
    <div className="w-full">
      <h2 className="mb-6 text-xl font-semibold text-black dark:text-zinc-50">
        Buscar ticket de ejecución de comando kubectl
      </h2>

      <form onSubmit={handleSubmit} className="mb-8 flex max-w-sm items-end gap-3">
        <div className="flex-1">
          <label htmlFor="ticketNumber" className={labelClassName}>
            Número de ticket
          </label>
          <input
            id="ticketNumber"
            type="number"
            min={1}
            required
            value={ticketNumber}
            onChange={(event) => setTicketNumber(event.target.value)}
            className={inputClassName}
          />
        </div>
        <button
          type="submit"
          disabled={isSearching}
          className="rounded-full bg-foreground px-5 py-2.5 text-background transition-colors hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]"
        >
          {isSearching ? "Buscando…" : "Buscar"}
        </button>
      </form>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      {!error && hasSearched && !isSearching && ticket && (
        <div className="w-full rounded border border-black/[.08] p-6 dark:border-white/[.145]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-black dark:text-zinc-50">
              Ticket #{ticket.number}
            </h3>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-black/[.05] px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-white/[.08] dark:text-zinc-300">
                {STATUS_LABELS[ticket.status]}
              </span>
              {ticket.status === "OPEN" && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleDecision("approve")}
                    disabled={isUpdating}
                    className="rounded-full bg-foreground px-4 py-2 text-sm text-background transition-colors hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]"
                  >
                    {isUpdating ? "Procesando…" : "Aprobar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecision("reject")}
                    disabled={isUpdating}
                    className="rounded-full border border-red-600 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-600 hover:text-white disabled:opacity-60 dark:border-red-400 dark:text-red-400"
                  >
                    {isUpdating ? "Procesando…" : "Rechazar"}
                  </button>
                </div>
              )}
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">ID</dt>
              <dd className="text-black dark:text-zinc-50">{ticket.id}</dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Informante</dt>
              <dd className="text-black dark:text-zinc-50">
                {ticket.informer}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Responsable</dt>
              <dd className="text-black dark:text-zinc-50">
                {ticket.assignee}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">
                Departamento
              </dt>
              <dd className="text-black dark:text-zinc-50">
                {ticket.department}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">
                Fecha de creación
              </dt>
              <dd className="text-black dark:text-zinc-50">
                {formatDate(ticket.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">
                Última actualización
              </dt>
              <dd className="text-black dark:text-zinc-50">
                {formatDate(ticket.updatedAt)}
              </dd>
            </div>
          </dl>

          <div className="mt-4">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Asunto
            </p>
            <p className="text-sm text-black dark:text-zinc-50">
              {ticket.subject}
            </p>
          </div>

          <div className="mt-4">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Descripción
            </p>
            <p className="whitespace-pre-wrap text-sm text-black dark:text-zinc-50">
              {ticket.description}
            </p>
          </div>

          <div className="mt-4">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Comando kubectl
            </p>
            <pre className="mt-1 overflow-x-auto rounded bg-zinc-100 p-3 font-mono text-xs text-black dark:bg-zinc-900 dark:text-zinc-50">
              kubectl {ticket.kubectlCommand}
            </pre>
          </div>

          <div className="mt-4">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Respuesta de ejecución
            </p>
            <pre className="mt-1 overflow-x-auto rounded bg-zinc-100 p-3 font-mono text-xs text-black dark:bg-zinc-900 dark:text-zinc-50">
              {formatResponse(ticket.response)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
