"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Alert, Button, Form } from "react-bootstrap";
import { SERVER_MANAGEMENT_TICKET_DEPARTMENT } from "@/app/features/server-management-ticket/server-management-ticket-constants";
import {
  createServerManagementTicket,
  getAssignees,
} from "@/app/features/server-management-ticket/server-management-ticket.service";

interface ValueListItem {
  value: string;
  label: string;
}

interface ServerManagementTicketFormValues {
  assignee: string;
  subject: string;
  description: string;
  codeAnsible: string;
}

interface ServerManagementTicketFormProps {
  informerEmail: string;
}

export function ServerManagementTicketForm({
  informerEmail,
}: ServerManagementTicketFormProps) {
  const [assignees, setAssignees] = useState<ValueListItem[] | null>(null);
  const [assigneesError, setAssigneesError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    resetField,
    setError,
    clearErrors,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ServerManagementTicketFormValues>({
    mode: "onChange",
    defaultValues: {
      assignee: "",
      subject: "",
      description: "",
      codeAnsible: "",
    },
  });

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

  const onSubmit = handleSubmit(async (data) => {
    clearErrors("root");
    setSuccess(null);

    try {
      await createServerManagementTicket(data);

      setSuccess("Ticket creado correctamente.");
      resetField("subject");
      resetField("description");
      resetField("codeAnsible");
    } catch (err) {
      setError("root", { message: (err as Error).message });
    }
  });

  return (
    <div style={{ maxWidth: 520 }}>
      <h2 className="h4 mb-4">Solicitar gestión de servidor</h2>

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
            value={SERVER_MANAGEMENT_TICKET_DEPARTMENT}
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

        <Form.Group className="mb-4" controlId="codeAnsible">
          <Form.Label>Código Ansible</Form.Label>
          <Form.Control
            as="textarea"
            rows={6}
            className="font-monospace"
            {...register("codeAnsible", { required: true })}
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
