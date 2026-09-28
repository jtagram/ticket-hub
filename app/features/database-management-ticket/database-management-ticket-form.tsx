"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Alert, Button, Form } from "react-bootstrap";
import {
  DATABASE_MANAGEMENT_TICKET_DEPARTMENT,
  DATABASE_MANAGEMENT_TICKET_NAMESPACE,
} from "@/app/features/database-management-ticket/database-management-ticket-constants";
import {
  createDatabaseManagementTicket,
  getAssignees,
  getDbNames,
  getDeployments,
} from "@/app/features/database-management-ticket/database-management-ticket.service";

interface ValueListItem {
  value: string;
  label: string;
}

interface DatabaseManagementTicketFormValues {
  assignee: string;
  subject: string;
  description: string;
  dbDeployment: string;
  dbName: string;
  sqlCode: string;
}

interface DatabaseManagementTicketFormProps {
  informerEmail: string;
}

export function DatabaseManagementTicketForm({
  informerEmail,
}: DatabaseManagementTicketFormProps) {
  const [assignees, setAssignees] = useState<ValueListItem[] | null>(null);
  const [assigneesError, setAssigneesError] = useState<string | null>(null);

  const [deployments, setDeployments] = useState<ValueListItem[] | null>(
    null,
  );
  const [deploymentsError, setDeploymentsError] = useState<string | null>(
    null,
  );

  const [dbNames, setDbNames] = useState<ValueListItem[] | null>(null);
  const [dbNamesError, setDbNamesError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    resetField,
    setError,
    clearErrors,
    formState: { errors, isSubmitting, isValid },
  } = useForm<DatabaseManagementTicketFormValues>({
    mode: "onChange",
    defaultValues: {
      assignee: "",
      subject: "",
      description: "",
      dbDeployment: "",
      dbName: "",
      sqlCode: "",
    },
  });

  const dbDeployment = useWatch({ control, name: "dbDeployment" });

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
          DATABASE_MANAGEMENT_TICKET_NAMESPACE,
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

  useEffect(() => {
    if (!dbDeployment) {
      return;
    }

    const controller = new AbortController();

    async function loadDbNames() {
      setDbNames(null);
      resetField("dbName");
      setDbNamesError(null);

      try {
        const loaded = await getDbNames(
          DATABASE_MANAGEMENT_TICKET_NAMESPACE,
          dbDeployment,
          controller.signal,
        );
        setDbNames(loaded);
      } catch (err) {
        if (controller.signal.aborted) return;
        setDbNamesError((err as Error).message);
      }
    }

    loadDbNames();
    return () => controller.abort();
  }, [dbDeployment, resetField]);

  const onSubmit = handleSubmit(async (data) => {
    clearErrors("root");
    setSuccess(null);

    try {
      await createDatabaseManagementTicket(data);

      setSuccess("Ticket creado correctamente.");
      resetField("subject");
      resetField("description");
      resetField("sqlCode");
    } catch (err) {
      setError("root", { message: (err as Error).message });
    }
  });

  return (
    <div style={{ maxWidth: 520 }}>
      <h2 className="h4 mb-4">Solicitar gestión de base de datos</h2>

      <Form onSubmit={onSubmit}>
        <Form.Group className="mb-3" controlId="informer">
          <Form.Label>Informante</Form.Label>
          <Form.Control plaintext readOnly value={informerEmail} />
        </Form.Group>

        <Form.Group className="mb-3" controlId="assignee">
          <Form.Label>Responsable</Form.Label>
          <Form.Select {...register("assignee", { required: true })}>
            <option value="" disabled>
              Seleccionar
            </option>
            {assignees?.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Form.Select>
          {assigneesError && (
            <Alert variant="danger" className="mt-2">
              {assigneesError}
            </Alert>
          )}
          {!assigneesError && assignees === null && (
            <Form.Text className="text-muted">Cargando…</Form.Text>
          )}
        </Form.Group>

        <Form.Group className="mb-3" controlId="department">
          <Form.Label>Departamento</Form.Label>
          <Form.Control
            plaintext
            readOnly
            value={DATABASE_MANAGEMENT_TICKET_DEPARTMENT}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="subject">
          <Form.Label>Asunto</Form.Label>
          <Form.Control
            {...register("subject", {
              required: "El asunto es obligatorio.",
              maxLength: { value: 500, message: "Máximo 500 caracteres." },
            })}
          />
          {errors.subject && (
            <Form.Text className="text-danger">
              {errors.subject.message}
            </Form.Text>
          )}
        </Form.Group>

        <Form.Group className="mb-3" controlId="description">
          <Form.Label>Descripción</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            {...register("description", {
              required: "La descripción es obligatoria.",
              maxLength: { value: 500, message: "Máximo 500 caracteres." },
            })}
          />
          {errors.description && (
            <Form.Text className="text-danger">
              {errors.description.message}
            </Form.Text>
          )}
        </Form.Group>

        <Form.Group className="mb-3" controlId="dbNamespace">
          <Form.Label>Namespace</Form.Label>
          <Form.Control
            plaintext
            readOnly
            value={DATABASE_MANAGEMENT_TICKET_NAMESPACE}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="dbDeployment">
          <Form.Label>Deployment</Form.Label>
          <Form.Select {...register("dbDeployment", { required: true })}>
            <option value="" disabled>
              Seleccionar
            </option>
            {deployments?.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Form.Select>
          {deploymentsError && (
            <Alert variant="danger" className="mt-2">
              {deploymentsError}
            </Alert>
          )}
          {!deploymentsError && deployments === null && (
            <Form.Text className="text-muted">Cargando…</Form.Text>
          )}
        </Form.Group>

        <Form.Group className="mb-4" controlId="dbName">
          <Form.Label>Base de datos</Form.Label>
          <Form.Select {...register("dbName", { required: true })}>
            <option value="" disabled>
              Seleccionar
            </option>
            {dbNames?.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Form.Select>
          {dbNamesError && (
            <Alert variant="danger" className="mt-2">
              {dbNamesError}
            </Alert>
          )}
          {!dbNamesError && !dbDeployment && (
            <Form.Text className="text-muted">
              Seleccioná un deployment primero.
            </Form.Text>
          )}
          {!dbNamesError && dbDeployment && dbNames === null && (
            <Form.Text className="text-muted">Cargando…</Form.Text>
          )}
        </Form.Group>

        <Form.Group className="mb-4" controlId="sqlCode">
          <Form.Label>SQL a ejecutar</Form.Label>
          <Form.Control
            as="textarea"
            rows={6}
            className="font-monospace"
            {...register("sqlCode", { required: true })}
          />
        </Form.Group>

        {errors.root && <Alert variant="danger">{errors.root.message}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Button type="submit" variant="dark" disabled={isSubmitting || !isValid}>
          {isSubmitting ? "Enviando…" : "Solicitar"}
        </Button>
      </Form>
    </div>
  );
}
