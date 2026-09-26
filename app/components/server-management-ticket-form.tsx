"use client";

import { useEffect, useState, type FormEvent } from "react";
import { SERVER_MANAGEMENT_TICKET_DEPARTMENT } from "@/app/lib/server-management-ticket-constants";

interface ValueListItem {
  value: string;
  label: string;
}

type ValueListResponse = ValueListItem[];

interface ErrorResponse {
  message?: string;
}

interface ServerManagementTicketFormProps {
  informerEmail: string;
}

export function ServerManagementTicketForm({
  informerEmail,
}: ServerManagementTicketFormProps) {
  const [assignees, setAssignees] = useState<ValueListItem[] | null>(null);
  const [assigneesError, setAssigneesError] = useState<string | null>(null);
  const [assignee, setAssignee] = useState("");

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [codeAnsible, setCodeAnsible] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAssignees() {
      try {
        const response = await fetch("/api/value-lists/assignees");
        const data = (await response
          .json()
          .catch(() => null)) as ValueListResponse | ErrorResponse | null;

        if (cancelled) return;

        if (!response.ok) {
          setAssigneesError(
            (data as ErrorResponse | null)?.message ??
              "No se pudieron obtener los responsables.",
          );
          return;
        }

        const loaded = (data as ValueListResponse) ?? [];
        setAssignees(loaded);
        if (loaded.length > 0) {
          setAssignee(loaded[0].value);
        }
      } catch {
        if (!cancelled) {
          setAssigneesError("No se pudo conectar con el servidor.");
        }
      }
    }

    loadAssignees();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/tickets/server/management", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignee,
          subject,
          description,
          codeAnsible,
        }),
      });

      const data = (await response
        .json()
        .catch(() => null)) as ErrorResponse | null;

      if (!response.ok) {
        setError(data?.message ?? "No se pudo crear el ticket.");
        return;
      }

      setSuccess("Ticket creado correctamente.");
      setSubject("");
      setDescription("");
      setCodeAnsible("");
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClassName =
    "w-full rounded border border-black/[.15] bg-white px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black/20 dark:border-white/[.2] dark:bg-black dark:text-zinc-50";
  const disabledInputClassName =
    "w-full rounded border border-black/[.15] bg-zinc-100 px-3 py-2 text-black disabled:opacity-100 dark:border-white/[.2] dark:bg-zinc-900 dark:text-zinc-50";
  const labelClassName =
    "mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

  return (
    <div className="max-w-lg">
      <h2 className="mb-6 text-xl font-semibold text-black dark:text-zinc-50">
        Solicitar gestión de servidor
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="informer" className={labelClassName}>
            Informante
          </label>
          <input
            id="informer"
            type="text"
            disabled
            readOnly
            value={informerEmail}
            className={disabledInputClassName}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="assignee" className={labelClassName}>
            Responsable
          </label>

          {assigneesError && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {assigneesError}
            </p>
          )}
          {!assigneesError && assignees === null && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Cargando…
            </p>
          )}
          {!assigneesError && assignees !== null && assignees.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No hay usuarios con permisos ADMIN o APPROVER en ticket-hub
              todavía.
            </p>
          )}
          {!assigneesError && assignees !== null && assignees.length > 0 && (
            <select
              id="assignee"
              required
              value={assignee}
              onChange={(event) => setAssignee(event.target.value)}
              className={inputClassName}
            >
              {assignees.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="department" className={labelClassName}>
            Departamento
          </label>
          <input
            id="department"
            type="text"
            disabled
            readOnly
            value={SERVER_MANAGEMENT_TICKET_DEPARTMENT}
            className={disabledInputClassName}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="subject" className={labelClassName}>
            Asunto
          </label>
          <input
            id="subject"
            type="text"
            required
            maxLength={500}
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className={inputClassName}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="description" className={labelClassName}>
            Descripción
          </label>
          <textarea
            id="description"
            required
            maxLength={500}
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className={inputClassName}
          />
        </div>

        <div className="mb-6">
          <label htmlFor="codeAnsible" className={labelClassName}>
            Código Ansible
          </label>
          <textarea
            id="codeAnsible"
            required
            rows={6}
            value={codeAnsible}
            onChange={(event) => setCodeAnsible(event.target.value)}
            className={`${inputClassName} font-mono text-sm`}
          />
        </div>

        {error && (
          <p className="mb-4 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}

        {success && (
          <p
            className="mb-4 text-sm text-green-600 dark:text-green-400"
            role="status"
          >
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !assignee}
          className="rounded-full bg-foreground px-5 py-2.5 text-background transition-colors hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]"
        >
          {isSubmitting ? "Enviando…" : "Solicitar"}
        </button>
      </form>
    </div>
  );
}
