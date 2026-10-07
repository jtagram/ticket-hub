"use client";

import { useState, type FormEvent } from "react";
import { Alert, Badge, Button, Card, Col, Form, Row } from "react-bootstrap";
import {
  getServerManagementTicket,
  updateServerManagementTicket,
} from "@/app/features/server-management-ticket/server-management-ticket.service";
import type { ServerManagementTicket } from "@/app/features/server-management-ticket/server-management-ticket.dto";

const STATUS_LABELS: Record<ServerManagementTicket["status"], string> = {
  OPEN: "Abierto",
  IN_PROGRESS: "En progreso",
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

export function ServerManagementTicketSearch() {
  const [ticketNumber, setTicketNumber] = useState("");
  const [ticket, setTicket] = useState<ServerManagementTicket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleDecision(action: "approve" | "reject") {
    if (!ticket) return;
    setError(null);
    setIsUpdating(true);
    try {
      const updated = await updateServerManagementTicket(
        ticket.number,
        action,
      );
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
      const found = await getServerManagementTicket(ticketNumber);
      setTicket(found);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div className="w-100">
      <h2 className="h4 mb-4">Buscar ticket de gestión de servidor</h2>

      <Form
        onSubmit={handleSubmit}
        className="d-flex align-items-end gap-3 mb-4"
        style={{ maxWidth: 380 }}
      >
        <Form.Group className="flex-grow-1" controlId="ticketNumber">
          <Form.Label>Número de ticket</Form.Label>
          <Form.Control
            type="number"
            min={1}
            required
            value={ticketNumber}
            onChange={(event) => setTicketNumber(event.target.value)}
          />
        </Form.Group>
        <Button type="submit" variant="dark" disabled={isSearching}>
          {isSearching ? "Buscando…" : "Buscar"}
        </Button>
      </Form>

      {error && <Alert variant="danger">{error}</Alert>}

      {!error && hasSearched && !isSearching && ticket && (
        <Card>
          <Card.Body>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <Card.Title as="h3" className="h5 mb-0">
                Ticket #{ticket.number}
              </Card.Title>
              <div className="d-flex align-items-center gap-3">
                <Badge bg="secondary">{STATUS_LABELS[ticket.status]}</Badge>
                {ticket.status === "OPEN" && (
                  <div className="d-flex gap-2">
                    <Button
                      size="sm"
                      variant="dark"
                      onClick={() => handleDecision("approve")}
                      disabled={isUpdating}
                    >
                      {isUpdating ? "Procesando…" : "Aprobar"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleDecision("reject")}
                      disabled={isUpdating}
                    >
                      {isUpdating ? "Procesando…" : "Rechazar"}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <Row className="gy-3 small">
              <Col xs={6}>
                <div className="text-muted">ID</div>
                <div>{ticket.id}</div>
              </Col>
              <Col xs={6}>
                <div className="text-muted">Informante</div>
                <div>{ticket.informer}</div>
              </Col>
              <Col xs={6}>
                <div className="text-muted">Responsable</div>
                <div>{ticket.assignee}</div>
              </Col>
              <Col xs={6}>
                <div className="text-muted">Departamento</div>
                <div>{ticket.department}</div>
              </Col>
              <Col xs={6}>
                <div className="text-muted">Fecha de creación</div>
                <div>{formatDate(ticket.createdAt)}</div>
              </Col>
              <Col xs={6}>
                <div className="text-muted">Última actualización</div>
                <div>{formatDate(ticket.updatedAt)}</div>
              </Col>
            </Row>

            <div className="mt-4">
              <div className="text-muted small">Asunto</div>
              <div className="small">{ticket.subject}</div>
            </div>

            <div className="mt-3">
              <div className="text-muted small">Descripción</div>
              <div className="small" style={{ whiteSpace: "pre-wrap" }}>
                {ticket.description}
              </div>
            </div>

            <div className="mt-3">
              <div className="text-muted small">Código Ansible</div>
              <pre
                className="mt-1 bg-light p-3 rounded small"
                style={{ overflowX: "auto" }}
              >
                {ticket.codeAnsible}
              </pre>
            </div>

            <div className="mt-3">
              <div className="text-muted small">Respuesta de ejecución</div>
              <pre
                className="mt-1 bg-light p-3 rounded small"
                style={{ overflowX: "auto" }}
              >
                {formatResponse(ticket.response)}
              </pre>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}
