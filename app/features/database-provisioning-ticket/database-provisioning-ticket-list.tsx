"use client";

import { useEffect, useState } from "react";
import { ListGroup } from "react-bootstrap";
import { getDatabaseProvisioningTickets } from "@/app/features/database-provisioning-ticket/database-provisioning-ticket.service";
import type { DatabaseProvisioningTicket } from "@/app/features/database-provisioning-ticket/database-provisioning-ticket.dto";

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("es-AR");
}

export function DatabaseProvisioningTicketList() {
  const [tickets, setTickets] = useState<
    DatabaseProvisioningTicket[] | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadTickets() {
      try {
        const loaded = await getDatabaseProvisioningTickets(
          controller.signal,
        );
        setTickets(loaded);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError((err as Error).message);
      }
    }

    loadTickets();
    return () => controller.abort();
  }, []);

  return (
    <div className="max-w-2xl">
      <h2 className="mb-6 text-xl font-semibold text-black dark:text-zinc-50">
        Tickets de aprovisionamiento de base de datos
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
        <ListGroup>
          {tickets.map((ticket) => (
            <ListGroup.Item key={ticket.id}>
              <div className="d-flex align-items-center justify-content-between">
                <span className="fw-medium">Ticket #{ticket.number}</span>
                <span className="text-muted small">
                  {formatDate(ticket.createdAt)}
                </span>
              </div>
              <div className="small mt-1">{ticket.subject}</div>
              <div className="text-muted small mt-1">
                Informante: {ticket.informer}
              </div>
              <div className="text-muted small mt-1">ID: {ticket.id}</div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </div>
  );
}
