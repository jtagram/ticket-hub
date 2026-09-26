"use client";

import { useState, type FormEvent } from "react";

interface KubernetesManifestTicket {
  id: number;
  number: number;
  informer: string;
  assignee: string;
  department: string;
  subject: string;
  status: "OPEN" | "APPROVED" | "REJECTED";
  description: string;
  namespace: string;
  action: "apply" | "create" | "delete";
  codeYaml: string;
  response: string;
  createdAt: string;
  updatedAt: string;
}

interface ErrorResponse {
  message?: string;
}

const STATUS_LABELS: Record<KubernetesManifestTicket["status"], string> = {
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

export function KubernetesManifestTicketSearch() {
  const [ticketNumber, setTicketNumber] = useState("");
  const [ticket, setTicket] = useState<KubernetesManifestTicket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setTicket(null);
    setIsSearching(true);
    setHasSearched(true);

    try {
      const response = await fetch(
        `/api/tickets/kubernetes/manifest/${ticketNumber}`,
      );
      const data = (await response
        .json()
        .catch(() => null)) as KubernetesManifestTicket | ErrorResponse | null;

      if (!response.ok) {
        setError(
          response.status === 404
            ? "No se encontró ningún ticket con ese número."
            : (data as ErrorResponse | null)?.message ??
                "No se pudo obtener el ticket.",
        );
        return;
      }

      setTicket(data as KubernetesManifestTicket);
    } catch {
      setError("No se pudo conectar con el servidor.");
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
        Buscar ticket de gestión de manifiestos de Kubernetes
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
            <span className="rounded-full bg-black/[.05] px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-white/[.08] dark:text-zinc-300">
              {STATUS_LABELS[ticket.status]}
            </span>
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
              <dt className="text-zinc-500 dark:text-zinc-400">Namespace</dt>
              <dd className="text-black dark:text-zinc-50">
                {ticket.namespace}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Acción</dt>
              <dd className="text-black dark:text-zinc-50">
                {ticket.action}
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
              Manifiesto YAML
            </p>
            <pre className="mt-1 overflow-x-auto rounded bg-zinc-100 p-3 font-mono text-xs text-black dark:bg-zinc-900 dark:text-zinc-50">
              {ticket.codeYaml}
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
