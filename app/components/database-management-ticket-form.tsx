"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  DATABASE_MANAGEMENT_TICKET_DEPARTMENT,
  DATABASE_MANAGEMENT_TICKET_NAMESPACE,
} from "@/app/lib/database-management-ticket-constants";

interface ValueListItem {
  value: string;
  label: string;
}

type ValueListResponse = ValueListItem[];

interface ErrorResponse {
  message?: string;
}

interface DatabaseManagementTicketFormProps {
  informerEmail: string;
}

export function DatabaseManagementTicketForm({
  informerEmail,
}: DatabaseManagementTicketFormProps) {
  const [assignees, setAssignees] = useState<ValueListItem[] | null>(null);
  const [assigneesError, setAssigneesError] = useState<string | null>(null);
  const [assignee, setAssignee] = useState("");

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  const [deployments, setDeployments] = useState<ValueListItem[] | null>(
    null,
  );
  const [deploymentsError, setDeploymentsError] = useState<string | null>(
    null,
  );
  const [dbDeployment, setDbDeployment] = useState("");

  const [dbNames, setDbNames] = useState<ValueListItem[] | null>(null);
  const [dbNamesError, setDbNamesError] = useState<string | null>(null);
  const [dbName, setDbName] = useState("");

  const [sqlCode, setSqlCode] = useState("");

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

  useEffect(() => {
    let cancelled = false;

    async function loadDeployments() {
      try {
        const response = await fetch(
          `/api/value-lists/database-deployments?namespace=${DATABASE_MANAGEMENT_TICKET_NAMESPACE}`,
        );
        const data = (await response
          .json()
          .catch(() => null)) as ValueListResponse | ErrorResponse | null;

        if (cancelled) return;

        if (!response.ok) {
          setDeploymentsError(
            (data as ErrorResponse | null)?.message ??
              "No se pudieron obtener los deployments.",
          );
          return;
        }

        const loaded = (data as ValueListResponse) ?? [];
        setDeployments(loaded);
        if (loaded.length > 0) {
          setDbDeployment(loaded[0].value);
        }
      } catch {
        if (!cancelled) {
          setDeploymentsError("No se pudo conectar con el servidor.");
        }
      }
    }

    loadDeployments();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!dbDeployment) {
      return;
    }

    let cancelled = false;

    async function loadDbNames() {
      setDbNames(null);
      setDbName("");
      setDbNamesError(null);

      try {
        const response = await fetch(
          `/api/value-lists/database-names?namespace=${DATABASE_MANAGEMENT_TICKET_NAMESPACE}&deployment=${dbDeployment}`,
        );
        const data = (await response
          .json()
          .catch(() => null)) as ValueListResponse | ErrorResponse | null;

        if (cancelled) return;

        if (!response.ok) {
          setDbNamesError(
            (data as ErrorResponse | null)?.message ??
              "No se pudieron obtener las bases de datos.",
          );
          return;
        }

        const loaded = (data as ValueListResponse) ?? [];
        setDbNames(loaded);
        if (loaded.length > 0) {
          setDbName(loaded[0].value);
        }
      } catch {
        if (!cancelled) {
          setDbNamesError("No se pudo conectar con el servidor.");
        }
      }
    }

    loadDbNames();
    return () => {
      cancelled = true;
    };
  }, [dbDeployment]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/tickets/database/management", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignee,
          subject,
          description,
          dbDeployment,
          dbName,
          sqlCode,
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
      setSqlCode("");
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
        Solicitar gestión de base de datos
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
            value={DATABASE_MANAGEMENT_TICKET_DEPARTMENT}
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

        <div className="mb-4">
          <label htmlFor="dbNamespace" className={labelClassName}>
            Namespace
          </label>
          <input
            id="dbNamespace"
            type="text"
            disabled
            readOnly
            value={DATABASE_MANAGEMENT_TICKET_NAMESPACE}
            className={disabledInputClassName}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="dbDeployment" className={labelClassName}>
            Deployment
          </label>

          {deploymentsError && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {deploymentsError}
            </p>
          )}
          {!deploymentsError && deployments === null && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Cargando…
            </p>
          )}
          {!deploymentsError &&
            deployments !== null &&
            deployments.length === 0 && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No hay deployments en este namespace.
              </p>
            )}
          {!deploymentsError && deployments !== null && deployments.length > 0 && (
            <select
              id="dbDeployment"
              required
              value={dbDeployment}
              onChange={(event) => setDbDeployment(event.target.value)}
              className={inputClassName}
            >
              {deployments.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="dbName" className={labelClassName}>
            Base de datos
          </label>

          {dbNamesError && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {dbNamesError}
            </p>
          )}
          {!dbNamesError && dbNames === null && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Cargando…
            </p>
          )}
          {!dbNamesError && dbNames !== null && dbNames.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Este deployment no tiene bases de datos.
            </p>
          )}
          {!dbNamesError && dbNames !== null && dbNames.length > 0 && (
            <select
              id="dbName"
              required
              value={dbName}
              onChange={(event) => setDbName(event.target.value)}
              className={inputClassName}
            >
              {dbNames.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="mb-6">
          <label htmlFor="sqlCode" className={labelClassName}>
            SQL a ejecutar
          </label>
          <textarea
            id="sqlCode"
            required
            rows={6}
            value={sqlCode}
            onChange={(event) => setSqlCode(event.target.value)}
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
          disabled={isSubmitting || !assignee || !dbDeployment || !dbName}
          className="rounded-full bg-foreground px-5 py-2.5 text-background transition-colors hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]"
        >
          {isSubmitting ? "Enviando…" : "Solicitar"}
        </button>
      </form>
    </div>
  );
}
