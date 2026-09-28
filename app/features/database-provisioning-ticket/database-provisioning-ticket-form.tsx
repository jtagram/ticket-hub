"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  DATABASE_PROVISIONING_TICKET_DEPARTMENT,
  DATABASE_PROVISIONING_TICKET_NAMESPACE,
} from "@/app/features/database-provisioning-ticket/database-provisioning-ticket-constants";
import {
  createDatabaseProvisioningTicket,
  getAssignees,
  getDeployments,
} from "@/app/features/database-provisioning-ticket/database-provisioning-ticket.service";

interface ValueListItem {
  value: string;
  label: string;
}

interface DatabaseProvisioningTicketFormProps {
  informerEmail: string;
}

export function DatabaseProvisioningTicketForm({
  informerEmail,
}: DatabaseProvisioningTicketFormProps) {
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

  const [newDbName, setNewDbName] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAssignees() {
      try {
        const loaded = await getAssignees(controller.signal);
        setAssignees(loaded);
      } catch (err) {
        if (controller.signal.aborted) return;
        setAssigneesError((err as Error).message);
      }
    }

    loadAssignees();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDeployments() {
      try {
        const loaded = await getDeployments(
          DATABASE_PROVISIONING_TICKET_NAMESPACE,
          controller.signal,
        );
        setDeployments(loaded);
      } catch (err) {
        if (controller.signal.aborted) return;
        setDeploymentsError((err as Error).message);
      }
    }

    loadDeployments();
    return () => controller.abort();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      await createDatabaseProvisioningTicket({
        assignee,
        subject,
        description,
        dbDeployment,
        newDbName,
      });

      setSuccess("Ticket creado correctamente.");
      setSubject("");
      setDescription("");
      setNewDbName("");
    } catch (err) {
      setError((err as Error).message);
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
        Solicitar aprovisionamiento de base de datos
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
              <option value="" disabled>
                Seleccionar
              </option>
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
            value={DATABASE_PROVISIONING_TICKET_DEPARTMENT}
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
            value={DATABASE_PROVISIONING_TICKET_NAMESPACE}
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
              <option value="" disabled>
                Seleccionar
              </option>
              {deployments.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="mb-6">
          <label htmlFor="newDbName" className={labelClassName}>
            Nombre de la nueva base de datos
          </label>
          <input
            id="newDbName"
            type="text"
            required
            maxLength={63}
            pattern="^[a-z_][a-z0-9_]*$"
            title="Solo minúsculas, números y guion bajo; debe empezar con letra o guion bajo."
            value={newDbName}
            onChange={(event) => setNewDbName(event.target.value)}
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
          disabled={isSubmitting || !assignee || !dbDeployment}
          className="rounded-full bg-foreground px-5 py-2.5 text-background transition-colors hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]"
        >
          {isSubmitting ? "Enviando…" : "Solicitar"}
        </button>
      </form>
    </div>
  );
}
